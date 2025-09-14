
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const studentName = searchParams.get('studentName');
    const sessionId = params.id;

    if (!studentName) {
      return NextResponse.json(
        { error: 'Student name is required' },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get student session and chat history
    const studentSession = await prisma.studentSession.findFirst({
      where: { 
        sessionId,
        studentName 
      }
    });

    if (!studentSession) {
      return NextResponse.json(
        { error: 'Student session not found' },
        { status: 404 }
      );
    }

    // Get participant data for current level
    const participant = await prisma.activeParticipant.findFirst({
      where: { sessionId, studentName }
    });

    const chatHistory = studentSession.chatLogJson as any[] || [];
    const currentLevel = participant?.currentQuestionLevel || 'Basic';

    // Count advanced questions for mastery status
    const advancedResponses = chatHistory.filter(msg => 
      msg.role === 'user' && msg.questionLevel === 'Advanced'
    ).length;

    const hasMasteredTopic = advancedResponses >= 3;

    return NextResponse.json({
      chatHistory: chatHistory.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp) // Ensure timestamp is properly converted
      })),
      currentLevel,
      hasMasteredTopic,
      advancedQuestionsAnswered: advancedResponses,
      sessionInfo: {
        topic: session.topic,
        gradeLevel: session.gradeLevel,
        sessionType: session.sessionType
      }
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
