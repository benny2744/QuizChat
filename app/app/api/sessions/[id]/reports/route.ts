
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateAssessmentMetrics } from '@/lib/assessment-scoring';
import { generateStudentMarkdownReport, generateSessionCSV, generateSessionAnalyticsCSV } from '@/lib/file-generation';
import { ChatMessage, CoreConcept } from '@/lib/types';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'md' or 'csv'
    const studentName = searchParams.get('student'); // For individual MD reports

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

    // Calculate metrics for all students
    const assessmentMetrics = session.studentSessions.map(studentSession => {
      const chatLog = studentSession.chatLogJson as unknown as ChatMessage[];
      return calculateAssessmentMetrics(chatLog, concepts, session.sessionType);
    });

    if (format === 'md') {
      // Generate individual student report
      if (!studentName) {
        return NextResponse.json(
          { error: 'Student name required for MD format' },
          { status: 400 }
        );
      }

      const studentIndex = session.studentSessions.findIndex(s => s.studentName === studentName);
      if (studentIndex === -1) {
        return NextResponse.json(
          { error: 'Student not found in session' },
          { status: 404 }
        );
      }

      const student = session.studentSessions[studentIndex];
      const metrics = assessmentMetrics[studentIndex];
      const chatLog = student.chatLogJson as unknown as ChatMessage[];

      const reportData = {
        student: {
          ...student,
          endTime: student.endTime || undefined,
          chatLogJson: chatLog,
          understandingScore: student.understandingScore || undefined,
          feedbackSummary: student.feedbackSummary || undefined
        },
        session: {
          ...session,
          conceptsJson: concepts,
          additionalContext: session.additionalContext || undefined,
          startTime: session.startTime || undefined,
          endTime: session.endTime || undefined
        },
        metrics,
        chatLog
      };

      const markdownReport = generateStudentMarkdownReport(reportData);
      
      const fileName = `${session.topic}_${studentName}_Report.md`.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      return new Response(markdownReport, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });

    } else if (format === 'csv') {
      // Generate CSV report for all students
      const sessionData = {
        session: {
          ...session,
          conceptsJson: concepts,
          additionalContext: session.additionalContext || undefined,
          startTime: session.startTime || undefined,
          endTime: session.endTime || undefined
        },
        studentSessions: session.studentSessions.map(s => ({
          ...s,
          endTime: s.endTime || undefined,
          chatLogJson: s.chatLogJson as unknown as ChatMessage[],
          understandingScore: s.understandingScore || undefined,
          feedbackSummary: s.feedbackSummary || undefined
        })),
        assessmentMetrics
      };

      const csvContent = generateSessionCSV(sessionData);
      const fileName = `${session.topic}_Session_Data.csv`.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });

    } else if (format === 'analytics') {
      // Generate detailed analytics CSV
      const sessionData = {
        session: {
          ...session,
          conceptsJson: concepts,
          additionalContext: session.additionalContext || undefined,
          startTime: session.startTime || undefined,
          endTime: session.endTime || undefined
        },
        studentSessions: session.studentSessions.map(s => ({
          ...s,
          endTime: s.endTime || undefined,
          chatLogJson: s.chatLogJson as unknown as ChatMessage[],
          understandingScore: s.understandingScore || undefined,
          feedbackSummary: s.feedbackSummary || undefined
        })),
        assessmentMetrics
      };

      const csvContent = generateSessionAnalyticsCSV(sessionData);
      const fileName = `${session.topic}_Analytics.csv`.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });

    } else {
      // Return available report options
      return NextResponse.json({
        sessionId,
        topic: session.topic,
        availableFormats: ['md', 'csv', 'analytics'],
        students: session.studentSessions.map(s => s.studentName),
        sampleUrls: {
          individualReport: `/api/sessions/${sessionId}/reports?format=md&student=${encodeURIComponent(session.studentSessions[0]?.studentName || 'StudentName')}`,
          sessionCSV: `/api/sessions/${sessionId}/reports?format=csv`,
          analyticsCSV: `/api/sessions/${sessionId}/reports?format=analytics`
        }
      });
    }

  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}
