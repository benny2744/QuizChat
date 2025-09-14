
import { ChatMessage, CoreConcept } from './types';

export interface AssessmentMetrics {
  understandingScore: number;
  engagementScore: number;
  progressionLevel: string;
  conceptMastery: { [concept: string]: number };
  responseQuality: number;
  feedbackSummary: string;
}

export interface QuestionLevelStats {
  Basic: number;
  Scenario: number;
  Advanced: number;
}

export function calculateAssessmentMetrics(
  chatLog: ChatMessage[],
  concepts: CoreConcept[],
  sessionType: string
): AssessmentMetrics {
  if (!chatLog || chatLog.length === 0) {
    return {
      understandingScore: 0,
      engagementScore: 0,
      progressionLevel: 'Basic',
      conceptMastery: {},
      responseQuality: 0,
      feedbackSummary: 'No interaction recorded.'
    };
  }

  const userMessages = chatLog.filter(msg => msg.role === 'user');
  const assistantMessages = chatLog.filter(msg => msg.role === 'assistant');
  
  // Calculate engagement score based on interaction quantity and quality
  const engagementScore = calculateEngagementScore(userMessages, assistantMessages);
  
  // Calculate understanding score based on response analysis
  const understandingScore = calculateUnderstandingScore(userMessages, concepts);
  
  // Determine progression level achieved
  const progressionLevel = determineProgressionLevel(chatLog);
  
  // Calculate concept mastery for each concept
  const conceptMastery = calculateConceptMastery(userMessages, concepts);
  
  // Calculate response quality score
  const responseQuality = calculateResponseQuality(userMessages);
  
  // Generate feedback summary
  const feedbackSummary = generateFeedbackSummary(
    understandingScore,
    engagementScore,
    progressionLevel,
    conceptMastery,
    sessionType
  );

  return {
    understandingScore,
    engagementScore,
    progressionLevel,
    conceptMastery,
    responseQuality,
    feedbackSummary
  };
}

function calculateEngagementScore(userMessages: ChatMessage[], assistantMessages: ChatMessage[]): number {
  const totalInteractions = userMessages.length;
  const avgResponseLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / totalInteractions || 0;
  
  // Base engagement on interaction count (max 10 interactions = 100%)
  const interactionScore = Math.min(totalInteractions * 10, 100);
  
  // Factor in response length quality (optimal 50-200 characters)
  let lengthQuality = 0;
  if (avgResponseLength >= 20 && avgResponseLength <= 300) {
    lengthQuality = 100;
  } else if (avgResponseLength >= 10 && avgResponseLength <= 500) {
    lengthQuality = 75;
  } else if (avgResponseLength >= 5) {
    lengthQuality = 50;
  }
  
  return Math.round((interactionScore * 0.7) + (lengthQuality * 0.3));
}

function calculateUnderstandingScore(userMessages: ChatMessage[], concepts: CoreConcept[]): number {
  if (userMessages.length === 0) return 0;
  
  let totalScore = 0;
  const conceptTerms = concepts.flatMap(c => 
    [c.name.toLowerCase(), ...c.examples.map(e => e.toLowerCase())]
  );
  
  userMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    let messageScore = 40; // Base score for participating
    
    // Bonus for using business terminology
    const conceptMatches = conceptTerms.filter(term => content.includes(term)).length;
    messageScore += Math.min(conceptMatches * 15, 40);
    
    // Bonus for longer, detailed responses
    if (content.length > 100) messageScore += 10;
    if (content.length > 200) messageScore += 10;
    
    // Check for analysis keywords
    const analysisKeywords = ['because', 'therefore', 'however', 'analyze', 'compare', 'evaluate'];
    const analysisMatches = analysisKeywords.filter(keyword => content.includes(keyword)).length;
    messageScore += analysisMatches * 5;
    
    totalScore += Math.min(messageScore, 100);
  });
  
  return Math.round(totalScore / userMessages.length);
}

function determineProgressionLevel(chatLog: ChatMessage[]): string {
  const levels = chatLog
    .filter(msg => msg.questionLevel)
    .map(msg => msg.questionLevel);
  
  if (levels.includes('Advanced')) return 'Advanced';
  if (levels.includes('Scenario')) return 'Scenario';
  return 'Basic';
}

function calculateConceptMastery(userMessages: ChatMessage[], concepts: CoreConcept[]): { [concept: string]: number } {
  const mastery: { [concept: string]: number } = {};
  
  concepts.forEach(concept => {
    const conceptTerms = [concept.name.toLowerCase(), ...concept.examples.map(e => e.toLowerCase())];
    let conceptScore = 0;
    let mentions = 0;
    
    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      const termMatches = conceptTerms.filter(term => content.includes(term)).length;
      
      if (termMatches > 0) {
        mentions++;
        conceptScore += Math.min(termMatches * 25, 75);
        
        // Bonus for context usage
        if (content.length > 50) conceptScore += 15;
      }
    });
    
    // Calculate final mastery score
    if (mentions > 0) {
      mastery[concept.name] = Math.round(Math.min(conceptScore / mentions, 100));
    } else {
      mastery[concept.name] = 0;
    }
  });
  
  return mastery;
}

function calculateResponseQuality(userMessages: ChatMessage[]): number {
  if (userMessages.length === 0) return 0;
  
  let totalQuality = 0;
  
  userMessages.forEach(msg => {
    let quality = 0;
    const content = msg.content;
    
    // Length appropriateness
    if (content.length >= 20 && content.length <= 500) quality += 30;
    else if (content.length >= 10) quality += 15;
    
    // Sentence structure (periods, question marks)
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) quality += 20;
    
    // Capitalization
    if (content[0] && content[0] === content[0].toUpperCase()) quality += 10;
    
    // Avoid single word responses
    if (content.trim().split(' ').length > 1) quality += 25;
    
    // Professional language indicators
    const professionalWords = ['business', 'market', 'customer', 'profit', 'strategy', 'analysis'];
    const profMatches = professionalWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    quality += Math.min(profMatches * 5, 15);
    
    totalQuality += quality;
  });
  
  return Math.round(totalQuality / userMessages.length);
}

function generateFeedbackSummary(
  understandingScore: number,
  engagementScore: number,
  progressionLevel: string,
  conceptMastery: { [concept: string]: number },
  sessionType: string
): string {
  let summary = '';
  
  // Overall performance assessment
  if (understandingScore >= 85) {
    summary += 'Excellent understanding demonstrated. ';
  } else if (understandingScore >= 70) {
    summary += 'Good grasp of the concepts shown. ';
  } else if (understandingScore >= 50) {
    summary += 'Basic understanding evident with room for improvement. ';
  } else {
    summary += 'Foundational concepts need reinforcement. ';
  }
  
  // Engagement feedback
  if (engagementScore >= 80) {
    summary += 'High level of engagement throughout the session. ';
  } else if (engagementScore >= 60) {
    summary += 'Good participation and interaction. ';
  } else {
    summary += 'Encourage more active participation in discussions. ';
  }
  
  // Progression feedback
  summary += `Successfully progressed to ${progressionLevel} level questions. `;
  
  // Concept mastery insights
  const masteryScores = Object.values(conceptMastery);
  if (masteryScores.length > 0) {
    const avgMastery = masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length;
    if (avgMastery >= 80) {
      summary += 'Strong command of key business concepts. ';
    } else if (avgMastery >= 60) {
      summary += 'Solid understanding of most concepts with some areas to strengthen. ';
    } else {
      summary += 'Focus on reviewing and applying key concepts more consistently. ';
    }
  }
  
  // Session type specific feedback
  if (sessionType === 'Pre-Assessment') {
    summary += 'Use this baseline to guide learning focus areas.';
  } else if (sessionType === 'Formative Check') {
    summary += 'Continue building on these foundations in upcoming lessons.';
  } else if (sessionType === 'Review Session') {
    summary += 'Good preparation shown for upcoming assessments.';
  } else if (sessionType === 'Unit Assessment') {
    summary += 'Assessment reflects current understanding of unit concepts.';
  }
  
  return summary.trim();
}

export function getQuestionLevelDistribution(chatLog: ChatMessage[]): QuestionLevelStats {
  const distribution = { Basic: 0, Scenario: 0, Advanced: 0 };
  
  chatLog
    .filter(msg => msg.questionLevel)
    .forEach(msg => {
      const level = msg.questionLevel as keyof QuestionLevelStats;
      if (distribution.hasOwnProperty(level)) {
        distribution[level]++;
      }
    });
  
  return distribution;
}
