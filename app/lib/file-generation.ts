
import { SessionData, StudentSessionData, ChatMessage } from './types';
import { calculateAssessmentMetrics, getQuestionLevelDistribution } from './assessment-scoring';

export interface StudentReportData {
  student: StudentSessionData;
  session: SessionData;
  metrics: any;
  chatLog: ChatMessage[];
}

export function generateStudentMarkdownReport(data: StudentReportData): string {
  const { student, session, metrics, chatLog } = data;
  const sessionDate = new Date(session.createdAt).toLocaleDateString();
  const duration = student.endTime && student.startTime ? 
    `${Math.round((new Date(student.endTime).getTime() - new Date(student.startTime).getTime()) / 60000)}` : 'N/A';

  const report = `# Student Learning Report

## Session Information
- **Student Name:** ${student.studentName}
- **Topic:** ${session.topic}
- **Grade Level:** ${session.gradeLevel}
- **Session Type:** ${session.sessionType}
- **Date:** ${sessionDate}
- **Duration:** ${duration} minutes

## Performance Summary

### Overall Scores
- **Understanding Score:** ${metrics.understandingScore}/100
- **Engagement Score:** ${metrics.engagementScore}/100
- **Response Quality:** ${metrics.responseQuality}/100
- **Progression Level:** ${metrics.progressionLevel}

### Concept Mastery
${Object.entries(metrics.conceptMastery)
  .map(([concept, score]) => `- **${concept}:** ${score}/100`)
  .join('\n')}

## Learning Objectives Assessment
${session.learningObjectives.map(obj => `- ${obj}`).join('\n')}

## Feedback Summary
${metrics.feedbackSummary}

## Conversation Highlights

### Question Progression
${getConversationHighlights(chatLog)}

## Recommendations for Continued Learning

### Strengths
${getStrengthRecommendations(metrics)}

### Areas for Improvement
${getImprovementRecommendations(metrics)}

### Next Steps
${getNextStepRecommendations(metrics, session.sessionType)}

---
*Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*
`;

  return report;
}

export function generateSessionCSV(sessionData: {
  session: SessionData;
  studentSessions: StudentSessionData[];
  assessmentMetrics: any[];
}): string {
  const { session, studentSessions, assessmentMetrics } = sessionData;
  
  const headers = [
    'Student Name',
    'Start Time',
    'End Time',
    'Duration (minutes)',
    'Understanding Score',
    'Engagement Score',
    'Response Quality',
    'Progression Level',
    'Total Messages',
    'Concept Mastery Average',
    'Session Type',
    'Topic',
    'Grade Level'
  ];

  const rows = studentSessions.map((student, index) => {
    const metrics = assessmentMetrics[index];
    const chatLog = student.chatLogJson as ChatMessage[] || [];
    const userMessages = chatLog.filter(msg => msg.role === 'user');
    
    const duration = student.endTime && student.startTime ? 
      Math.round((new Date(student.endTime).getTime() - new Date(student.startTime).getTime()) / 60000) : null;
    
    const conceptMasteryAvg = Object.values(metrics.conceptMastery as {[key: string]: number})
      .reduce((sum, score) => sum + score, 0) / Object.keys(metrics.conceptMastery).length || 0;

    return [
      student.studentName,
      student.startTime?.toLocaleString() || '',
      student.endTime?.toLocaleString() || '',
      duration !== null ? duration.toString() : 'N/A',
      metrics.understandingScore.toString(),
      metrics.engagementScore.toString(),
      metrics.responseQuality.toString(),
      metrics.progressionLevel,
      userMessages.length.toString(),
      Math.round(conceptMasteryAvg).toString(),
      session.sessionType,
      session.topic,
      session.gradeLevel
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

export function generateSessionAnalyticsCSV(sessionData: {
  session: SessionData;
  studentSessions: StudentSessionData[];
  assessmentMetrics: any[];
}): string {
  const { session, studentSessions, assessmentMetrics } = sessionData;
  
  // Generate concept mastery breakdown
  const conceptHeaders = ['Student Name'];
  const concepts = (session.conceptsJson as any[]) || [];
  concepts.forEach(concept => {
    conceptHeaders.push(`${concept.name} Mastery`);
  });
  
  const conceptRows = studentSessions.map((student, index) => {
    const metrics = assessmentMetrics[index];
    const row = [student.studentName];
    
    concepts.forEach(concept => {
      const masteryScore = metrics.conceptMastery[concept.name] || 0;
      row.push(masteryScore.toString());
    });
    
    return row;
  });

  const conceptCsvContent = [
    conceptHeaders.join(','),
    ...conceptRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return conceptCsvContent;
}

function getConversationHighlights(chatLog: ChatMessage[]): string {
  const levelDistribution = getQuestionLevelDistribution(chatLog);
  
  let highlights = '';
  if (levelDistribution.Basic > 0) {
    highlights += `- Completed ${levelDistribution.Basic} basic-level interactions\n`;
  }
  if (levelDistribution.Scenario > 0) {
    highlights += `- Engaged with ${levelDistribution.Scenario} scenario-based questions\n`;
  }
  if (levelDistribution.Advanced > 0) {
    highlights += `- Successfully tackled ${levelDistribution.Advanced} advanced-level challenges\n`;
  }
  
  return highlights || '- Initial engagement with basic concepts';
}

function getStrengthRecommendations(metrics: any): string {
  const strengths = [];
  
  if (metrics.understandingScore >= 80) {
    strengths.push('Strong conceptual understanding demonstrated');
  }
  if (metrics.engagementScore >= 80) {
    strengths.push('Excellent participation and interaction');
  }
  if (metrics.responseQuality >= 80) {
    strengths.push('High-quality, thoughtful responses');
  }
  if (metrics.progressionLevel === 'Advanced') {
    strengths.push('Successfully progressed to advanced-level thinking');
  }
  
  // Check concept mastery strengths
  const strongConcepts = Object.entries(metrics.conceptMastery)
    .filter(([_, score]) => (score as number) >= 80)
    .map(([concept]) => concept);
  
  if (strongConcepts.length > 0) {
    strengths.push(`Strong mastery of: ${strongConcepts.join(', ')}`);
  }
  
  return strengths.length > 0 ? 
    strengths.map(s => `- ${s}`).join('\n') : 
    '- Active participation in learning activities';
}

function getImprovementRecommendations(metrics: any): string {
  const improvements = [];
  
  if (metrics.understandingScore < 60) {
    improvements.push('Focus on reviewing core concepts and terminology');
  }
  if (metrics.engagementScore < 60) {
    improvements.push('Increase participation in class discussions');
  }
  if (metrics.responseQuality < 60) {
    improvements.push('Provide more detailed and thoughtful responses');
  }
  
  // Check concept mastery weaknesses
  const weakConcepts = Object.entries(metrics.conceptMastery)
    .filter(([_, score]) => (score as number) < 60)
    .map(([concept]) => concept);
  
  if (weakConcepts.length > 0) {
    improvements.push(`Additional practice needed with: ${weakConcepts.join(', ')}`);
  }
  
  return improvements.length > 0 ? 
    improvements.map(i => `- ${i}`).join('\n') : 
    '- Continue building on current understanding';
}

function getNextStepRecommendations(metrics: any, sessionType: string): string {
  const nextSteps = [];
  
  if (sessionType === 'Pre-Assessment') {
    nextSteps.push('Begin focused learning on identified gap areas');
    nextSteps.push('Set specific learning goals based on this assessment');
  } else if (sessionType === 'Formative Check') {
    if (metrics.understandingScore >= 75) {
      nextSteps.push('Ready to advance to more complex applications');
    } else {
      nextSteps.push('Review current concepts before progressing');
    }
  } else if (sessionType === 'Review Session') {
    nextSteps.push('Complete additional practice problems');
    nextSteps.push('Review identified weak areas before assessment');
  }
  
  nextSteps.push('Discuss results with instructor for personalized guidance');
  
  return nextSteps.map(step => `- ${step}`).join('\n');
}
