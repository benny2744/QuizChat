
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
  
  // Count questions answered at each level
  const levelStats = { Basic: 0, Scenario: 0, Advanced: 0 };
  userMessages.forEach(msg => {
    if (msg.questionLevel && levelStats.hasOwnProperty(msg.questionLevel)) {
      levelStats[msg.questionLevel as keyof typeof levelStats]++;
    }
  });
  
  // If student answered 3+ advanced questions, they should get >90
  if (levelStats.Advanced >= 3) {
    return Math.min(90 + (levelStats.Advanced - 3) * 2, 100);
  }
  
  // If student progressed to advanced and answered some, high score
  if (levelStats.Advanced >= 1) {
    return Math.min(75 + (levelStats.Advanced * 5) + (levelStats.Scenario * 2), 89);
  }
  
  // If student progressed to scenario level, medium-high score
  if (levelStats.Scenario >= 2) {
    return Math.min(60 + (levelStats.Scenario * 3) + (levelStats.Basic * 1), 74);
  }
  
  // Basic level responses only
  if (levelStats.Basic >= 2) {
    return Math.min(40 + (levelStats.Basic * 2), 59);
  }
  
  // Minimal participation
  return Math.max(userMessages.length * 10, 25);
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
    const content = msg.content.trim();
    let quality = 0;
    
    // Check if response is relevant and sufficient
    const words = content.split(' ').filter(w => w.length > 0);
    
    // Relevance check - not just one word answers or very short responses
    if (words.length >= 3) {
      quality += 40; // Base score for relevant, multi-word answers
    } else if (words.length >= 2) {
      quality += 20; // Minimal but acceptable
    } else {
      quality += 5;  // Single word answers are low quality
    }
    
    // Sufficient information check - longer responses tend to have more info
    if (content.length >= 30) {
      quality += 30; // Good detail level
    } else if (content.length >= 15) {
      quality += 20; // Some detail
    } else if (content.length >= 8) {
      quality += 10; // Minimal detail
    }
    
    // Bonus for demonstrating understanding through explanations
    const explanationWords = ['because', 'since', 'therefore', 'so that', 'in order to', 'due to'];
    const hasExplanation = explanationWords.some(word => content.toLowerCase().includes(word));
    if (hasExplanation) quality += 15;
    
    // Bonus for topic-relevant content
    const businessTerms = ['business', 'market', 'customer', 'profit', 'strategy', 'company', 'sales', 'product'];
    const relevantTerms = businessTerms.filter(term => content.toLowerCase().includes(term)).length;
    quality += Math.min(relevantTerms * 5, 15);
    
    // Penalty for very generic responses
    const genericResponses = ['yes', 'no', 'ok', 'sure', 'maybe', 'i think', 'not sure', 'don\'t know'];
    const isGeneric = genericResponses.some(generic => content.toLowerCase().trim() === generic);
    if (isGeneric) quality -= 20;
    
    totalQuality += Math.max(quality, 0); // Ensure no negative scores
  });
  
  return Math.round(Math.min(totalQuality / userMessages.length, 100));
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
