
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

    if (!studentName) {
      return NextResponse.json(
        { error: 'Student name is required' },
        { status: 400 }
      );
    }

    // Get the student session with chat history
    const studentSession = await prisma.studentSession.findFirst({
      where: { 
        sessionId: params.id,
        studentName: studentName
      }
    });

    if (!studentSession) {
      return NextResponse.json(
        { error: 'Student session not found' },
        { status: 404 }
      );
    }

    // Return the chat history
    const chatHistory = studentSession.chatLogJson as any[] || [];
    
    return NextResponse.json({
      chatHistory: chatHistory,
      studentName: studentSession.studentName,
      sessionId: studentSession.sessionId,
      startTime: studentSession.startTime,
      endTime: studentSession.endTime
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
