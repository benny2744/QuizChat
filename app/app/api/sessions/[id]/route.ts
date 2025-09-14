
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        studentSessions: true,
        activeParticipants: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...session,
      conceptsJson: session.conceptsJson as any
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // If ending a session, calculate final participant count and end student sessions
    let participantCount = body.participantCount;
    if (body.isActive === false) {
      const studentSessions = await prisma.studentSession.findMany({
        where: { sessionId: params.id }
      });
      participantCount = studentSessions.length;
      
      // End all student sessions that haven't ended yet
      const currentTime = new Date();
      await prisma.studentSession.updateMany({
        where: { 
          sessionId: params.id,
          endTime: null
        },
        data: { endTime: currentTime }
      });

      // Clean up active participants
      await prisma.activeParticipant.deleteMany({
        where: { sessionId: params.id }
      });
    }
    
    // Update the session
    const updateData: any = {
      ...body,
      ...(participantCount !== undefined && { participantCount })
    };

    // Set start time if activating and no start time exists
    if (body.isActive === true && !body.startTime) {
      updateData.startTime = new Date();
    }

    // Set end time if deactivating and no end time exists
    if (body.isActive === false && !body.endTime) {
      updateData.endTime = new Date();
    }
    
    const session = await prisma.session.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      ...session,
      conceptsJson: session.conceptsJson as any
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.session.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
