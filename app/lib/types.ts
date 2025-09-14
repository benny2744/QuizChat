export interface SessionFormData {
  topic: string;
  gradeLevel: string;
  sessionType: string;
  concepts: CoreConcept[];
  learningObjectives: string[];
  assessmentFocus: string[];
  difficultyProgression: string;
  additionalContext?: string;
}

export interface CoreConcept {
  name: string;
  examples: string[];
  commonMisconceptions: string[];
}

export interface SessionData {
  id: string;
  topic: string;
  gradeLevel: string;
  sessionType: string;
  conceptsJson: CoreConcept[];
  learningObjectives: string[];
  assessmentFocus: string[];
  difficultyProgression: string;
  additionalContext?: string;
  sessionCode: string;
  createdAt: Date;
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  participantCount?: number;
}

export interface StudentSessionData {
  id: string;
  sessionId: string;
  studentName: string;
  startTime: Date;
  endTime?: Date;
  chatLogJson: ChatMessage[];
  understandingScore?: number;
  feedbackSummary?: string;
}

export interface ActiveParticipantData {
  id: string;
  sessionId: string;
  studentName: string;
  currentQuestionLevel: string;
  lastActivity: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  questionLevel?: string;
}

export interface SessionStats {
  totalParticipants: number;
  activeParticipants: number;
  averageUnderstandingScore?: number;
  questionLevelDistribution: {
    Basic: number;
    Scenario: number;
    Advanced: number;
  };
}

export const GRADE_LEVELS = [
  '9th Grade',
  '10th Grade', 
  '11th Grade',
  '12th Grade'
] as const;

export const SESSION_TYPES = [
  'Pre-Assessment',
  'Formative Check',
  'Review Session',
  'Unit Assessment',
  'Final Review'
] as const;

export const ASSESSMENT_FOCUS_AREAS = [
  'Vocabulary Understanding',
  'Concept Application',
  'Critical Thinking',
  'Problem Solving',
  'Case Study Analysis',
  'Real-world Connections'
] as const;

export const DIFFICULTY_PROGRESSIONS = [
  'Gradual (Basic → Scenario → Advanced)',
  'Adaptive (Based on performance)',
  'Mixed (Random difficulty)',
  'Fixed Level (Same throughout)'
] as const;