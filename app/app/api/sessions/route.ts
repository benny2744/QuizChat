
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateSessionCode } from '@/lib/utils';
import { SessionFormData } from '@/lib/types';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    let sessions;
    
    if (includeStats) {
      sessions = await prisma.session.findMany({
        include: {
          _count: {
            select: { 
              activeParticipants: true,
              studentSessions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      sessions = await prisma.session.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    const formattedSessions = sessions.map(session => ({
      ...session,
      conceptsJson: session.conceptsJson as any,
      participantCount: includeStats ? (session as any)._count?.activeParticipants || 0 : undefined
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SessionFormData = await request.json();
    
    let sessionCode = generateSessionCode();
    
    // Ensure unique session code
    while (await prisma.session.findUnique({ where: { sessionCode } })) {
      sessionCode = generateSessionCode();
    }

    const session = await prisma.session.create({
      data: {
        topic: body.topic,
        gradeLevel: body.gradeLevel,
        sessionType: body.sessionType,
        conceptsJson: body.concepts as any,
        learningObjectives: body.learningObjectives,
        assessmentFocus: body.assessmentFocus,
        difficultyProgression: body.difficultyProgression,
        additionalContext: body.additionalContext,
        sessionCode: sessionCode
      }
    });

    return NextResponse.json({
      ...session,
      conceptsJson: session.conceptsJson as any
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
