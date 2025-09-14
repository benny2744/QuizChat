
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

    // Count advanced questions answered
    const advancedResponses = existingChatLog.filter(msg => 
      msg.role === 'user' && msg.questionLevel === 'Advanced'
    ).length;

    // Check if student has mastered the topic (3+ advanced answers)
    const hasMasteredTopic = advancedResponses >= 3;

    // Prepare conversation context for LLM (limit to last 20 messages for optimal context window)
    const MAX_CONTEXT_MESSAGES = 20;
    const recentChatHistory = existingChatLog.slice(-MAX_CONTEXT_MESSAGES);
    
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

    // Create different system message based on student's mastery status
    let systemMessage = '';
    
    if (hasMasteredTopic) {
      systemMessage = `You are an educational AI tutor. The student has demonstrated excellent mastery by successfully answering 3 or more advanced-level questions about ${session.topic}.

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
      systemMessage = `You are an AI tutor that generates questions for learners in a structured progression of difficulty. You follow Bloom's Revised Taxonomy to guide question design:
- Level 1–2: Remembering & Understanding (definitions, concept recall, explain in own words)
- Level 3–4: Applying & Analyzing (apply concepts in scenarios, interpret data, compare/contrast ideas)
- Level 5–6: Evaluating & Creating (judgment, critique, defend a position, design a solution)

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

BLOOM'S TAXONOMY LEVEL GUIDELINES:
**Basic Level (Remembering & Understanding)**: Focus on definitions, concept recall, and basic comprehension. Ask students to remember facts or explain concepts in their own words.
**Scenario Level (Applying & Analyzing)**: Present real-world situations where students apply concepts, analyze data, or compare/contrast different ideas.
**Advanced Level (Evaluating & Creating)**: Challenge students to make judgments, critique ideas, defend positions, or create solutions.

${responseStyle}

CRITICAL RULES:
1. Clear progression from easier → harder questions based on Bloom's taxonomy
2. NEVER repeat or rephrase previously asked questions - track what has been discussed
3. Never circle back to earlier levels unless specifically instructed
4. Questions should become deeper and more complex over time
5. Keep responses age-appropriate for ${session.gradeLevel}
6. Focus on the current difficulty level: ${currentLevel}
7. Always end with a specific follow-up question that advances learning
8. Be concise and educational - avoid unnecessary elaboration

Remember: You have access to the full conversation history, so build upon previous discussions and avoid repetition.

Student's message: ${message}`;
    }

    // Prepare messages with conversation context for LLM
    const messages = [
      { role: 'system', content: systemMessage }
    ];

    // Add recent conversation history for context
    recentChatHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call LLM API without streaming to avoid duplication issues
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', errorMessage);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: errorMessage 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
