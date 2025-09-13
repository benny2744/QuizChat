
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participants = await prisma.activeParticipant.findMany({
      where: { sessionId: params.id },
      orderBy: { lastActivity: 'desc' }
    });

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { studentName } = await request.json();
    
    if (!studentName?.trim()) {
      return NextResponse.json(
        { error: 'Student name is required' },
        { status: 400 }
      );
    }

    // Check if session exists and is active
    const session = await prisma.session.findUnique({
      where: { id: params.id }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!session.isActive) {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Create or update active participant
    const participant = await prisma.activeParticipant.upsert({
      where: {
        sessionId_studentName: {
          sessionId: params.id,
          studentName: studentName.trim()
        }
      },
      update: {
        lastActivity: new Date()
      },
      create: {
        sessionId: params.id,
        studentName: studentName.trim(),
        currentQuestionLevel: 'Basic'
      }
    });

    // Create student session if doesn't exist
    await prisma.studentSession.upsert({
      where: {
        sessionId_studentName: {
          sessionId: params.id,
          studentName: studentName.trim()
        }
      },
      update: {},
      create: {
        sessionId: params.id,
        studentName: studentName.trim(),
        chatLogJson: []
      }
    });

    return NextResponse.json(participant);
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: 500 }
    );
  }
}
