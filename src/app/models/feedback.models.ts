export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export type FeedbackCategory =
  | 'bug_report'
  | 'feature_request'
  | 'usability_ux'
  | 'performance'
  | 'integration_api'
  | 'praise';

export type FeedbackSentiment = 'positive' | 'neutral' | 'negative';

export type FeedbackUrgency = 'low' | 'medium' | 'high' | 'critical';

export type FeedbackStatus = 'new' | 'triaged' | 'planned' | 'resolved';

export interface FeedbackAnalysisResult {
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  sentimentScore: number; // -1.0 to +1.0
  urgency: FeedbackUrgency;
  themes: string[];
  priorityScore: number; // 0 to 100
  actionRecommendation: string;
  analyzerEngine: 'deterministic-nlp' | 'gemini-4-hydrogen';
  confidence: number; // 0.0 to 1.0
}

export interface FeedbackEntry {
  id: string;
  rating: FeedbackRating;
  title: string;
  comment: string;
  area: string;
  userCategoryHint?: FeedbackCategory;
  contactEmail?: string;
  submittedBy: string;
  status: FeedbackStatus;
  analysis: FeedbackAnalysisResult;
  createdAt: number;
  updatedAt: number;
}

export interface FeedbackSubmissionPayload {
  rating: FeedbackRating;
  title: string;
  comment: string;
  area?: string;
  userCategoryHint?: FeedbackCategory;
  contactEmail?: string;
  submittedBy?: string;
}

export interface FeedbackCategoryMetric {
  category: FeedbackCategory;
  label: string;
  count: number;
  averageRating: number;
  averagePriority: number;
}

export interface FeedbackThemeMetric {
  theme: string;
  count: number;
  averageRating: number;
}

export interface FeedbackAnalyticsReport {
  totalSubmissions: number;
  averageRating: number;
  npsScore: number; // -100 to +100
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  openActionCount: number;
  categoryBreakdown: FeedbackCategoryMetric[];
  topThemes: FeedbackThemeMetric[];
  topPriorities: Array<{
    id: string;
    title: string;
    category: FeedbackCategory;
    urgency: FeedbackUrgency;
    priorityScore: number;
    status: FeedbackStatus;
    actionRecommendation: string;
  }>;
  lastUpdatedAt: number;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface ExternalServiceContract {
  id: string;
  name: string;
  purpose: string;
  protocol: string;
  dataFormats: string;
  authScheme: string;
  timeoutMs: number;
  maxRetries: number;
  allowedHosts: string[];
  rateLimitPolicy: string;
  securityControls: string[];
  circuitState: CircuitState;
  consecutiveFailures: number;
  lastCheckedAt: number | null;
  lastLatencyMs: number | null;
}

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  serviceId?: string;
  retryable: boolean;
  upstreamStatus?: number;
  correlationId: string;
  timestamp: number;
}

export interface ApiClientResult<T> {
  ok: boolean;
  data?: T;
  error?: ApiErrorEnvelope;
}
