import { GoogleGenAI, Type } from '@google/genai';
import type {
  FeedbackAnalysisResult,
  FeedbackAnalyticsReport,
  FeedbackCategory,
  FeedbackCategoryMetric,
  FeedbackEntry,
  FeedbackRating,
  FeedbackSentiment,
  FeedbackSubmissionPayload,
  FeedbackThemeMetric,
  FeedbackUrgency,
} from '../app/models/feedback.models';

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug_report: 'Bug & Reliability',
  feature_request: 'Feature Request',
  usability_ux: 'Usability & UX',
  performance: 'Speed & Performance',
  integration_api: 'APIs & Integrations',
  praise: 'Positive Highlights',
};

const VALID_CATEGORIES = new Set<FeedbackCategory>([
  'bug_report',
  'feature_request',
  'usability_ux',
  'performance',
  'integration_api',
  'praise',
]);

const CATEGORY_KEYWORD_MAP: Array<{ category: FeedbackCategory; keywords: string[]; weight: number }> = [
  {
    category: 'bug_report',
    keywords: [
      'bug',
      'crash',
      'broken',
      'fail',
      'failed',
      'error',
      'exception',
      'stuck',
      '500',
      '404',
      'blank',
    ],
    weight: 3,
  },
  {
    category: 'integration_api',
    keywords: [
      'api',
      'webhook',
      'oauth',
      'sync',
      'gitlab',
      'polar',
      'appwrite',
      'turso',
      'wopi',
      'token',
      'endpoint',
    ],
    weight: 3,
  },
  {
    category: 'performance',
    keywords: ['slow', 'latency', 'lag', 'timeout', 'freeze', 'loading', 'fast', 'speed', 'memory'],
    weight: 2.5,
  },
  {
    category: 'feature_request',
    keywords: [
      'feature',
      'add',
      'support',
      'export',
      'would love',
      'wish',
      'please allow',
      'roadmap',
      'dark mode',
    ],
    weight: 2,
  },
  {
    category: 'usability_ux',
    keywords: [
      'confusing',
      'unclear',
      'layout',
      'button',
      'navigation',
      'hard to find',
      'readable',
      'intuitive',
      'ui',
      'ux',
    ],
    weight: 2,
  },
  {
    category: 'praise',
    keywords: ['great', 'love', 'awesome', 'clean', 'smooth', 'helpful', 'thank', 'excellent', 'perfect'],
    weight: 1.5,
  },
];

const THEME_RULES: Array<{ theme: string; keywords: string[] }> = [
  {
    theme: 'Navigation & Workspace Flow',
    keywords: ['navigation', 'menu', 'window', 'dock', 'launcher', 'layout', 'find'],
  },
  {
    theme: 'API & Data Sync',
    keywords: ['api', 'sync', 'webhook', 'endpoint', 'appwrite', 'turso', 'token', 'timeout'],
  },
  {
    theme: 'Document & File Handling',
    keywords: ['document', 'file', 'wopi', 'upload', 'download', 'lock', 'pdf'],
  },
  {
    theme: 'Speed & Responsiveness',
    keywords: ['slow', 'fast', 'latency', 'lag', 'speed', 'loading', 'freeze'],
  },
  {
    theme: 'Billing & Plan Clarity',
    keywords: ['billing', 'price', 'cost', 'polar', 'checkout', 'xi', 'invoice'],
  },
  {
    theme: 'Release & UAT Readiness',
    keywords: ['uat', 'staging', 'gitlab', 'release', 'sign-off', 'pipeline', 'test'],
  },
  {
    theme: 'Security & Access Control',
    keywords: ['auth', 'permission', 'role', 'security', 'access', 'login', 'rbac'],
  },
];

const URGENCY_CRITICAL_TERMS = ['crash', 'data loss', 'outage', 'cannot login', 'blocked', 'security', '500'];
const URGENCY_HIGH_TERMS = ['broken', 'error', 'timeout', 'fail', 'failed', 'stuck', 'wrong'];
const POSITIVE_TERMS = [
  'great',
  'love',
  'smooth',
  'fast',
  'clean',
  'intuitive',
  'helpful',
  'awesome',
  'excellent',
];
const NEGATIVE_TERMS = [
  'broken',
  'bug',
  'slow',
  'crash',
  'confusing',
  'error',
  'fail',
  'frustrating',
  'hard',
  'missing',
];

function stripUnsafeText(input: string): string {
  const withoutTags = input.replace(/[<>]/g, '');
  let cleaned = '';
  for (let i = 0; i < withoutTags.length; i++) {
    const code = withoutTags.charCodeAt(i);
    cleaned += code <= 31 || code === 127 ? ' ' : withoutTags[i];
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function validateAndSanitizeSubmission(payload: FeedbackSubmissionPayload): {
  valid: boolean;
  error?: string;
  sanitized?: Required<Omit<FeedbackSubmissionPayload, 'userCategoryHint' | 'contactEmail'>> & {
    userCategoryHint?: FeedbackCategory;
    contactEmail?: string;
  };
} {
  const ratingNum = Number(payload.rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { valid: false, error: 'Please select a rating between 1 and 5 stars.' };
  }

  const title = stripUnsafeText(String(payload.title || ''));
  if (title.length < 3 || title.length > 120) {
    return { valid: false, error: 'Feedback headline must be between 3 and 120 characters.' };
  }

  const comment = stripUnsafeText(String(payload.comment || ''));
  if (comment.length < 8 || comment.length > 2000) {
    return { valid: false, error: 'Feedback details must be between 8 and 2000 characters.' };
  }

  const area = stripUnsafeText(String(payload.area || 'General Workspace')) || 'General Workspace';
  const submittedBy =
    stripUnsafeText(String(payload.submittedBy || 'Workspace Member')) || 'Workspace Member';

  const contactEmailRaw = payload.contactEmail ? stripUnsafeText(String(payload.contactEmail)) : undefined;
  if (contactEmailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmailRaw)) {
    return { valid: false, error: 'Please provide a valid email address or leave it blank.' };
  }

  const userCategoryHint =
    payload.userCategoryHint && VALID_CATEGORIES.has(payload.userCategoryHint)
      ? payload.userCategoryHint
      : undefined;

  return {
    valid: true,
    sanitized: {
      rating: ratingNum as FeedbackRating,
      title,
      comment,
      area,
      userCategoryHint,
      contactEmail: contactEmailRaw || undefined,
      submittedBy,
    },
  };
}

export function analyzeFeedbackDeterministic(input: {
  rating: FeedbackRating;
  title: string;
  comment: string;
  area?: string;
  userCategoryHint?: FeedbackCategory;
}): FeedbackAnalysisResult {
  const text = `${input.title} ${input.comment} ${input.area || ''}`.toLowerCase();

  // 1. Category classification
  const scores = new Map<FeedbackCategory, number>();
  for (const rule of CATEGORY_KEYWORD_MAP) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        score += rule.weight;
      }
    }
    if (score > 0) {
      scores.set(rule.category, score);
    }
  }

  if (input.userCategoryHint && VALID_CATEGORIES.has(input.userCategoryHint)) {
    scores.set(input.userCategoryHint, (scores.get(input.userCategoryHint) || 0) + 3.5);
  }

  let category: FeedbackCategory = input.rating >= 4 && scores.size === 0 ? 'praise' : 'usability_ux';
  let bestScore = 0;
  for (const [cat, score] of scores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      category = cat;
    }
  }
  if (input.rating >= 4 && bestScore === 0 && !input.userCategoryHint) {
    category = 'praise';
  }

  // 2. Sentiment & normalized score (-1.0 to +1.0)
  const posHits = POSITIVE_TERMS.filter((t) => text.includes(t)).length;
  const negHits = NEGATIVE_TERMS.filter((t) => text.includes(t)).length;
  const ratingBase = (input.rating - 3) / 2; // -1 to +1
  const lexicalAdjustment = Math.max(-0.35, Math.min(0.35, (posHits - negHits) * 0.12));
  const sentimentScore = Number(Math.max(-1, Math.min(1, ratingBase * 0.75 + lexicalAdjustment)).toFixed(2));

  let sentiment: FeedbackSentiment = 'neutral';
  if (sentimentScore >= 0.2 || input.rating >= 4) {
    sentiment = negHits > posHits + 1 && input.rating <= 3 ? 'negative' : 'positive';
  } else if (sentimentScore <= -0.15 || input.rating <= 2) {
    sentiment = 'negative';
  }

  // 3. Urgency calculation
  let urgency: FeedbackUrgency = 'low';
  if (URGENCY_CRITICAL_TERMS.some((t) => text.includes(t)) || (input.rating === 1 && negHits >= 1)) {
    urgency = 'critical';
  } else if (
    URGENCY_HIGH_TERMS.some((t) => text.includes(t)) ||
    input.rating <= 2 ||
    category === 'bug_report'
  ) {
    urgency = 'high';
  } else if (input.rating === 3 || category === 'feature_request' || category === 'integration_api') {
    urgency = 'medium';
  }

  // 4. Theme extraction
  const themes = THEME_RULES.filter((r) => r.keywords.some((kw) => text.includes(kw))).map((r) => r.theme);
  if (themes.length === 0) {
    themes.push(input.area?.trim() || 'General Experience');
  }

  // 5. Development Priority Score (0..100)
  const ratingSeverity = (6 - input.rating) * 11; // 11..55
  const urgencyWeight: Record<FeedbackUrgency, number> = {
    critical: 30,
    high: 22,
    medium: 12,
    low: 4,
  };
  const categoryWeight: Record<FeedbackCategory, number> = {
    bug_report: 15,
    integration_api: 13,
    performance: 12,
    usability_ux: 9,
    feature_request: 8,
    praise: 0,
  };
  const priorityScore = Math.min(
    100,
    Math.max(5, Math.round(ratingSeverity + urgencyWeight[urgency] + categoryWeight[category])),
  );

  // 6. Action recommendation for product & engineering backlog
  const actionRecommendation = buildActionRecommendation(category, urgency, themes[0]);

  return {
    category,
    sentiment,
    sentimentScore,
    urgency,
    themes: themes.slice(0, 3),
    priorityScore,
    actionRecommendation,
    analyzerEngine: 'deterministic-nlp',
    confidence: bestScore > 0 ? 0.88 : 0.74,
  };
}

function buildActionRecommendation(
  category: FeedbackCategory,
  urgency: FeedbackUrgency,
  primaryTheme: string,
): string {
  switch (category) {
    case 'bug_report':
      return urgency === 'critical'
        ? `Escalate immediately to on-call engineering for ${primaryTheme} root-cause fix and regression test.`
        : `Reproduce issue in ${primaryTheme}, add automated regression test, and schedule patch in current sprint.`;
    case 'integration_api':
      return `Audit gateway timeout, retry, and error-envelope handling for ${primaryTheme} connector.`;
    case 'performance':
      return `Profile request latency and client rendering overhead within ${primaryTheme} to hit <=200ms target.`;
    case 'usability_ux':
      return `Simplify workflow copy and interaction affordances in ${primaryTheme}; validate with UAT stakeholders.`;
    case 'feature_request':
      return `Evaluate product scope for ${primaryTheme} enhancement and queue for upcoming milestone planning.`;
    case 'praise':
      return `Preserve current design pattern in ${primaryTheme} and share benchmark across sister modules.`;
  }
}

export async function analyzeFeedbackWithGemini(entry: FeedbackEntry): Promise<FeedbackAnalysisResult> {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server Secrets.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = [
    'Analyze the following product user feedback and classify it for engineering roadmap triage.',
    `Rating: ${entry.rating}/5`,
    `Area: ${entry.area}`,
    `Title: ${entry.title}`,
    `Comment: ${entry.comment}`,
  ].join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'Classify software user feedback accurately into one category, sentiment, urgency, up to 3 concise themes, a 0-100 priorityScore, and a concrete one-sentence actionRecommendation.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description:
              'One of: bug_report, feature_request, usability_ux, performance, integration_api, praise',
          },
          sentiment: { type: Type.STRING, description: 'One of: positive, neutral, negative' },
          sentimentScore: { type: Type.NUMBER, description: 'Number between -1 and 1' },
          urgency: { type: Type.STRING, description: 'One of: low, medium, high, critical' },
          themes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          priorityScore: { type: Type.INTEGER, description: 'Integer 0 to 100' },
          actionRecommendation: { type: Type.STRING },
        },
        required: [
          'category',
          'sentiment',
          'sentimentScore',
          'urgency',
          'themes',
          'priorityScore',
          'actionRecommendation',
        ],
      },
    },
  });

  const parsed = JSON.parse((response.text || '{}').trim()) as Partial<FeedbackAnalysisResult>;
  const category = VALID_CATEGORIES.has(parsed.category as FeedbackCategory)
    ? (parsed.category as FeedbackCategory)
    : entry.analysis.category;
  const sentiment: FeedbackSentiment =
    parsed.sentiment === 'positive' || parsed.sentiment === 'neutral' || parsed.sentiment === 'negative'
      ? parsed.sentiment
      : entry.analysis.sentiment;
  const urgency: FeedbackUrgency =
    parsed.urgency === 'low' ||
    parsed.urgency === 'medium' ||
    parsed.urgency === 'high' ||
    parsed.urgency === 'critical'
      ? parsed.urgency
      : entry.analysis.urgency;

  return {
    category,
    sentiment,
    sentimentScore:
      typeof parsed.sentimentScore === 'number'
        ? Math.max(-1, Math.min(1, parsed.sentimentScore))
        : entry.analysis.sentimentScore,
    urgency,
    themes:
      Array.isArray(parsed.themes) && parsed.themes.length > 0
        ? parsed.themes.slice(0, 3).map((t) => stripUnsafeText(String(t)))
        : entry.analysis.themes,
    priorityScore:
      typeof parsed.priorityScore === 'number'
        ? Math.max(0, Math.min(100, Math.round(parsed.priorityScore)))
        : entry.analysis.priorityScore,
    actionRecommendation: parsed.actionRecommendation
      ? stripUnsafeText(String(parsed.actionRecommendation))
      : entry.analysis.actionRecommendation,
    analyzerEngine: 'gemini-4-hydrogen',
    confidence: 0.94,
  };
}

export function computeFeedbackAnalytics(entries: FeedbackEntry[]): FeedbackAnalyticsReport {
  const total = entries.length;
  if (total === 0) {
    return {
      totalSubmissions: 0,
      averageRating: 0,
      npsScore: 0,
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0,
      openActionCount: 0,
      categoryBreakdown: [],
      topThemes: [],
      topPriorities: [],
      lastUpdatedAt: Date.now(),
    };
  }

  const avgRating = Number((entries.reduce((sum, e) => sum + e.rating, 0) / total).toFixed(2));
  const promoters = entries.filter((e) => e.rating === 5).length;
  const detractors = entries.filter((e) => e.rating <= 3).length;
  const npsScore = Math.round(((promoters - detractors) / total) * 100);

  const positiveCount = entries.filter((e) => e.analysis.sentiment === 'positive').length;
  const neutralCount = entries.filter((e) => e.analysis.sentiment === 'neutral').length;
  const negativeCount = entries.filter((e) => e.analysis.sentiment === 'negative').length;
  const openActionCount = entries.filter(
    (e) => e.status !== 'resolved' && e.analysis.category !== 'praise',
  ).length;

  const catGroups = new Map<FeedbackCategory, FeedbackEntry[]>();
  for (const entry of entries) {
    const list = catGroups.get(entry.analysis.category) || [];
    list.push(entry);
    catGroups.set(entry.analysis.category, list);
  }

  const categoryBreakdown: FeedbackCategoryMetric[] = Array.from(catGroups.entries())
    .map(([category, group]) => ({
      category,
      label: FEEDBACK_CATEGORY_LABELS[category],
      count: group.length,
      averageRating: Number((group.reduce((s, e) => s + e.rating, 0) / group.length).toFixed(2)),
      averagePriority: Math.round(group.reduce((s, e) => s + e.analysis.priorityScore, 0) / group.length),
    }))
    .sort((a, b) => b.count - a.count);

  const themeGroups = new Map<string, number[]>();
  for (const entry of entries) {
    for (const theme of entry.analysis.themes) {
      const ratings = themeGroups.get(theme) || [];
      ratings.push(entry.rating);
      themeGroups.set(theme, ratings);
    }
  }

  const topThemes: FeedbackThemeMetric[] = Array.from(themeGroups.entries())
    .map(([theme, ratings]) => ({
      theme,
      count: ratings.length,
      averageRating: Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topPriorities = [...entries]
    .filter((e) => e.status !== 'resolved')
    .sort((a, b) => b.analysis.priorityScore - a.analysis.priorityScore)
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      title: e.title,
      category: e.analysis.category,
      urgency: e.analysis.urgency,
      priorityScore: e.analysis.priorityScore,
      status: e.status,
      actionRecommendation: e.analysis.actionRecommendation,
    }));

  return {
    totalSubmissions: total,
    averageRating: avgRating,
    npsScore,
    positiveCount,
    neutralCount,
    negativeCount,
    openActionCount,
    categoryBreakdown,
    topThemes,
    topPriorities,
    lastUpdatedAt: Date.now(),
  };
}
