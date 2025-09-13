
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { sessionId, studentName, message } = await request.json();

    // Get session and student data
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return new Response('Session not found', { status: 404 });
    }

    const studentSession = await prisma.studentSession.findFirst({
      where: { sessionId, studentName }
    });

    if (!studentSession) {
      return new Response('Student session not found', { status: 404 });
    }

    // Get current participant data
    const participant = await prisma.activeParticipant.findFirst({
      where: { sessionId, studentName }
    });

    const concepts = session.conceptsJson as any[];
    const learningObjectives = session.learningObjectives;
    const assessmentFocus = session.assessmentFocus;
    const currentLevel = participant?.currentQuestionLevel || 'Basic';

    // Create system message for the chatbot
    const systemMessage = `You are an educational AI tutor for a high school business class. 

Session Details:
- Topic: ${session.topic}
- Grade Level: ${session.gradeLevel}
- Session Type: ${session.sessionType}
- Current Question Level: ${currentLevel}

Core Concepts:
${concepts.map(c => `- ${c.name}: ${c.definition}\n  Examples: ${c.examples.join(', ')}\n  Common Misconceptions: ${c.commonMisconceptions.join(', ')}`).join('\n')}

Learning Objectives:
${learningObjectives.map(obj => `- ${obj}`).join('\n')}

Assessment Focus Areas:
${assessmentFocus.map(focus => `- ${focus}`).join('\n')}

Instructions:
1. Keep responses educational and age-appropriate for ${session.gradeLevel}
2. Focus on the current difficulty level: ${currentLevel}
3. Ask engaging questions that test understanding
4. Provide clear explanations with real-world examples
5. Encourage critical thinking
6. Keep responses concise but informative (2-3 paragraphs max)
7. End with a follow-up question to continue the conversation

Student's message: ${message}`;

    // Call LLM API with streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        stream: true,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    // Update participant activity
    await prisma.activeParticipant.update({
      where: {
        sessionId_studentName: { sessionId, studentName }
      },
      data: { lastActivity: new Date() }
    });

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader?.read() ?? { done: true, value: undefined };
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Save chat log to database
                  const chatLog = studentSession.chatLogJson as any[] || [];
                  chatLog.push(
                    { 
                      id: Date.now().toString(), 
                      role: 'user', 
                      content: message, 
                      timestamp: new Date(),
                      questionLevel: currentLevel 
                    },
                    { 
                      id: (Date.now() + 1).toString(), 
                      role: 'assistant', 
                      content: fullResponse, 
                      timestamp: new Date(),
                      questionLevel: currentLevel 
                    }
                  );

                  await prisma.studentSession.update({
                    where: { id: studentSession.id },
                    data: { chatLogJson: chatLog }
                  });

                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                  }
                  controller.enqueue(encoder.encode(chunk));
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
