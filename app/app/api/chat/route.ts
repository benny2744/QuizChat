
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Context window management - limit to last 10-20 messages for 5-10 minute conversations
const MAX_CONTEXT_MESSAGES = 20;

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

    // Get the conversation history and manage context window
    const existingChatLog = studentSession.chatLogJson as any[] || [];
    
    // Limit context to last MAX_CONTEXT_MESSAGES for LLM processing
    const recentChatHistory = existingChatLog.slice(-MAX_CONTEXT_MESSAGES);
    
    const conversationLength = existingChatLog.filter(msg => msg.role === 'user').length;

    // Count advanced questions answered
    const advancedResponses = existingChatLog.filter(msg => 
      msg.role === 'user' && msg.questionLevel === 'Advanced'
    ).length;

    // Check if student has mastered the topic (3+ advanced answers)
    const hasMasteredTopic = advancedResponses >= 3;
    
    // Determine if we should progress to the next level
    let nextLevel = currentLevel;
    if (currentLevel === 'Basic' && conversationLength >= 2) {
      nextLevel = 'Scenario';
    } else if (currentLevel === 'Scenario' && conversationLength >= 4) {
      nextLevel = 'Advanced';
    }

    // Create different system message based on student's mastery status
    let systemMessage = '';
    
    if (hasMasteredTopic) {
      systemMessage = `You are an AI tutor that generates questions for learners in a structured progression of difficulty. The student has demonstrated excellent mastery by successfully answering 3 or more advanced-level questions about ${session.topic}.

IMPORTANT: This student has achieved mastery. Your response should:
1. Congratulate them on their excellent understanding of ${session.topic}
2. Acknowledge their progression through all difficulty levels
3. Provide a brief, positive summary of what they've learned
4. Encourage them to "leave the session" now that they've demonstrated mastery
5. DO NOT ask any more questions - they have completed the assessment successfully

Session Details:
- Topic: ${session.topic}
- Grade Level: ${session.gradeLevel}
- Advanced Questions Answered: ${advancedResponses}
- Student has achieved mastery level

Student's final message: ${message}`;
    } else {
      systemMessage = `You are an AI tutor that generates questions for learners in a structured progression of difficulty. 
You follow Bloom's Revised Taxonomy to guide question design:
- Level 1–2: Remembering & Understanding (definitions, concept recall, explain in own words)
- Level 3–4: Applying & Analyzing (apply concepts in scenarios, interpret data, compare/contrast ideas)
- Level 5–6: Evaluating & Creating (judgment, critique, defend a position, design a solution)

Rules for behavior:
1. Always generate questions in a clear progression from easier → harder.
2. Do not repeat or rephrase previously asked questions. Each new question must be unique.
3. Never circle back to earlier levels unless explicitly instructed.
4. Ensure questions become deeper and more complex over time.
5. Questions should be precise, age-appropriate, and avoid giving away answers.
6. Maintain internal tracking of which levels and question types have already been asked.

Session Details:
- Topic: ${session.topic}
- Grade Level: ${session.gradeLevel}
- Session Type: ${session.sessionType}
- Current Question Level: ${currentLevel}
- Messages from Student: ${conversationLength}
- Advanced Questions Answered: ${advancedResponses}/3

Core Concepts to Assess:
${concepts.map(c => `- ${c.name}${c.definition ? ': ' + c.definition : ''}${c.examples && c.examples.length > 0 ? '\n  Examples: ' + c.examples.join(', ') : ''}${c.commonMisconceptions && c.commonMisconceptions.length > 0 ? '\n  Common Misconceptions: ' + c.commonMisconceptions.join(', ') : ''}`).join('\n')}

Learning Objectives:
${learningObjectives.map(obj => `- ${obj}`).join('\n')}

Assessment Focus Areas:
${assessmentFocus.map(focus => `- ${focus}`).join('\n')}

DIFFICULTY LEVEL GUIDELINES (Based on Bloom's Taxonomy):
**Basic Level (Remembering & Understanding)**: Focus on definitions and simple recall. Ask "What is..." or "Explain..." questions.
**Scenario Level (Applying & Analyzing)**: Present real-world situations. Ask "What would you do if..." or "How would you analyze..." questions.  
**Advanced Level (Evaluating & Creating)**: Challenge analysis and evaluation. Ask "Why do you think..." or "How would you design..." questions.

RESPONSE STYLE: Keep responses concise but informative:
- 1-2 short paragraphs maximum for explanations
- Clear and focused questions
- Age-appropriate for ${session.gradeLevel}

Instructions:
1. Review the conversation history to understand what has been discussed
2. Focus on the current difficulty level: ${currentLevel}
3. Ask engaging questions that test understanding based on Bloom's Taxonomy
4. Always end with a specific follow-up question
5. Be concise - avoid unnecessary elaboration
6. Do not repeat questions or topics already covered in the conversation

Student's current message: ${message}`;
    }

    // Prepare messages for LLM with conversation history for context
    const messages = [
      { role: 'system', content: systemMessage }
    ];

    // Add recent conversation history for context (limited to MAX_CONTEXT_MESSAGES)
    recentChatHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add the current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call LLM API with conversation context
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
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
    const chatLog = [...existingChatLog]; // Keep full history in database
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
      questionLevel: nextLevel,
      hasMasteredTopic: hasMasteredTopic,
      advancedQuestionsAnswered: advancedResponses
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
