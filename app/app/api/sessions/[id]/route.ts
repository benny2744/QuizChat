
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
        activeParticipants: true,
        _count: {
          select: { 
            activeParticipants: true,
            studentSessions: true
          }
        }
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
      conceptsJson: session.conceptsJson as any,
      participantCount: (session as any)._count?.activeParticipants || 0
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
    console.log('PATCH session request body:', body);
    
    // First, check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: params.id }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data with only valid Session model fields
    const updateData: any = {};
    
    // Handle isActive changes
    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
      
      // If ending a session, cleanup and set end times
      if (body.isActive === false) {
        const currentTime = new Date();
        updateData.endTime = currentTime;
        
        try {
          // End all student sessions that haven't ended yet
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
          
          console.log('Successfully cleaned up student sessions and active participants');
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
          // Continue with session update even if cleanup fails
        }
      }
      
      // If activating a session, set start time if not already set
      if (body.isActive === true && !existingSession.startTime) {
        updateData.startTime = new Date();
      }
    }

    // Add other valid fields that might be in the body
    if (body.topic) updateData.topic = body.topic;
    if (body.gradeLevel) updateData.gradeLevel = body.gradeLevel;
    if (body.sessionType) updateData.sessionType = body.sessionType;
    if (body.conceptsJson) updateData.conceptsJson = body.conceptsJson;
    if (body.learningObjectives) updateData.learningObjectives = body.learningObjectives;
    if (body.assessmentFocus) updateData.assessmentFocus = body.assessmentFocus;
    if (body.difficultyProgression) updateData.difficultyProgression = body.difficultyProgression;
    if (body.additionalContext !== undefined) updateData.additionalContext = body.additionalContext;
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);

    console.log('Update data prepared:', updateData);
    
    // Update the session
    const session = await prisma.session.update({
      where: { id: params.id },
      data: updateData
    });

    console.log('Session updated successfully:', session.id);

    // Get updated session with counts for response
    const updatedSession = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { 
            activeParticipants: true,
            studentSessions: true
          }
        }
      }
    });

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found after update' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...updatedSession,
      conceptsJson: updatedSession.conceptsJson as any,
      participantCount: (updatedSession as any)._count?.activeParticipants || 0
    });
  } catch (error) {
    console.error('Error updating session:', error);
    console.error('Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    return NextResponse.json(
      { error: 'Failed to update session status', details: (error as Error).message },
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
