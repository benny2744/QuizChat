
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateAssessmentMetrics } from '@/lib/assessment-scoring';
import { ChatMessage, CoreConcept } from '@/lib/types';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    // Get session data with all student sessions
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        studentSessions: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const concepts = session.conceptsJson as unknown as CoreConcept[];
    const updatedSessions = [];

    // Calculate assessment metrics for each student
    for (const studentSession of session.studentSessions) {
      const chatLog = studentSession.chatLogJson as unknown as ChatMessage[];
      
      const metrics = calculateAssessmentMetrics(
        chatLog,
        concepts,
        session.sessionType
      );

      // Update the student session with calculated metrics
      const updatedSession = await prisma.studentSession.update({
        where: { id: studentSession.id },
        data: {
          understandingScore: metrics.understandingScore,
          feedbackSummary: metrics.feedbackSummary
        }
      });

      updatedSessions.push({
        ...updatedSession,
        metrics
      });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      assessments: updatedSessions.length,
      results: updatedSessions
    });

  } catch (error) {
    console.error('Error calculating assessments:', error);
    return NextResponse.json(
      { error: 'Failed to calculate assessments' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    // Get session with student data and calculated metrics
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        studentSessions: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Return assessment overview
    const assessmentSummary = {
      sessionId,
      topic: session.topic,
      sessionType: session.sessionType,
      totalStudents: session.studentSessions.length,
      completedAssessments: session.studentSessions.filter(s => s.understandingScore !== null).length,
      averageScore: session.studentSessions
        .filter(s => s.understandingScore !== null)
        .reduce((sum, s) => sum + (s.understandingScore || 0), 0) / 
        (session.studentSessions.filter(s => s.understandingScore !== null).length || 1),
      students: session.studentSessions.map(s => ({
        name: s.studentName,
        score: s.understandingScore,
        feedback: s.feedbackSummary,
        messageCount: (s.chatLogJson as unknown as ChatMessage[] || []).filter(m => m.role === 'user').length
      }))
    };

    return NextResponse.json(assessmentSummary);

  } catch (error) {
    console.error('Error fetching assessment summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment summary' },
      { status: 500 }
    );
  }
}
