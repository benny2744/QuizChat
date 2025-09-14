
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

    // Get the conversation history to determine progression
    const existingChatLog = studentSession.chatLogJson as any[] || [];
    const conversationLength = existingChatLog.filter(msg => msg.role === 'user').length;

    // Determine if we should progress to the next level
    let nextLevel = currentLevel;
    if (currentLevel === 'Basic' && conversationLength >= 2) {
      nextLevel = 'Scenario';
    } else if (currentLevel === 'Scenario' && conversationLength >= 4) {
      nextLevel = 'Advanced';
    }

    // Create system message for the chatbot
    let responseStyle = '';
    if (session.sessionType === 'Formative Assessment' || session.sessionType === 'Review Session') {
      responseStyle = `
RESPONSE STYLE: Keep responses BRIEF and DIRECT for ${session.sessionType}:
- Maximum 2-3 sentences
- No lengthy explanations unless student asks for clarification
- Focus on quick check-ins and targeted questions
- Get straight to the point`;
    } else {
      responseStyle = `
RESPONSE STYLE: Keep responses concise but informative:
- 1-2 short paragraphs maximum
- Clear and focused explanations`;
    }

    const systemMessage = `You are an educational AI tutor for a high school business class. You adapt your questioning style based on the current difficulty level and student progress.

Session Details:
- Topic: ${session.topic}
- Grade Level: ${session.gradeLevel}
- Session Type: ${session.sessionType}
- Current Question Level: ${currentLevel}
- Messages from Student: ${conversationLength}

Core Concepts to Assess:
${concepts.map(c => `- ${c.name}${c.definition ? ': ' + c.definition : ''}${c.examples && c.examples.length > 0 ? '\n  Examples: ' + c.examples.join(', ') : ''}${c.commonMisconceptions && c.commonMisconceptions.length > 0 ? '\n  Common Misconceptions: ' + c.commonMisconceptions.join(', ') : ''}`).join('\n')}

Learning Objectives:
${learningObjectives.map(obj => `- ${obj}`).join('\n')}

Assessment Focus Areas:
${assessmentFocus.map(focus => `- ${focus}`).join('\n')}

DIFFICULTY LEVEL GUIDELINES:
**Basic Level**: Focus on definitions and simple recall. Ask "What is..." questions.
**Scenario Level**: Present real-world situations. Ask "What would you do if..." questions.  
**Advanced Level**: Challenge analysis and evaluation. Ask "Why do you think..." questions.
${responseStyle}

Instructions:
1. Keep responses educational and age-appropriate for ${session.gradeLevel}
2. Focus on the current difficulty level: ${currentLevel}
3. Ask engaging questions that test understanding
4. Always end with a specific follow-up question
5. Be concise - avoid unnecessary elaboration

Student's message: ${message}`;

    // Call LLM API without streaming to avoid duplication issues
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
        stream: false,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'I apologize, but I encountered an issue processing your message. Please try again.';

    // Update participant activity
    await prisma.activeParticipant.update({
      where: {
        sessionId_studentName: { sessionId, studentName }
      },
      data: { lastActivity: new Date() }
    });

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
        content: assistantMessage, 
        timestamp: new Date(),
        questionLevel: currentLevel 
      }
    );

    await prisma.studentSession.update({
      where: { id: studentSession.id },
      data: { chatLogJson: chatLog }
    });

    // Update participant's level if it progressed
    if (nextLevel !== currentLevel) {
      await prisma.activeParticipant.update({
        where: {
          sessionId_studentName: { sessionId, studentName }
        },
        data: { currentQuestionLevel: nextLevel }
      });
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      questionLevel: nextLevel 
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
