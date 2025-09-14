

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

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

    const sessionId = params.id;
    const currentTime = new Date();

    // Update the student session end time if not already set
    const studentSession = await prisma.studentSession.updateMany({
      where: {
        sessionId,
        studentName: studentName.trim(),
        endTime: null  // Only update if endTime is not already set
      },
      data: {
        endTime: currentTime
      }
    });

    // Remove from active participants
    await prisma.activeParticipant.deleteMany({
      where: {
        sessionId,
        studentName: studentName.trim()
      }
    });

    return NextResponse.json({
      success: true,
      studentName: studentName.trim(),
      endTime: currentTime
    });

  } catch (error) {
    console.error('Error leaving session:', error);
    return NextResponse.json(
      { error: 'Failed to leave session' },
      { status: 500 }
    );
  }
}

