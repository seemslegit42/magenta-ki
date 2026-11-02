export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Invocation {
  prompt: string;
  context?: Record<string, unknown>;
  sessionId?: string;
}

export interface Agent {
  name(): string;
  description(): string;
  run(invocation: Invocation): Promise<Message>;
}

export interface ModelProvider {
  generate(prompt: string, context?: Record<string, unknown>): Promise<{ text: string; polarUsage?: unknown }>;
}
