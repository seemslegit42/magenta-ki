import { Injectable, signal } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class BladesService implements Agent {
  private agentName = signal<string>('Blades-WebOS-Agent');
  private agentDescription = signal<string>('Multimodal AI Agent framework wrapper for Λ Ξ V O S executing chain-of-thought reasoning.');
  private memoryLogs = signal<Message[]>([]);
  private isExecuting = signal<boolean>(false);

  public readonly activeAgentName = this.agentName.asReadonly();
  public readonly activeAgentDescription = this.agentDescription.asReadonly();
  public readonly memory = this.memoryLogs.asReadonly();
  public readonly busy = this.isExecuting.asReadonly();

  public name(): string {
    return this.agentName();
  }

  public description(): string {
    return this.agentDescription();
  }

  public async run(invocation: Invocation): Promise<Message> {
    this.isExecuting.set(true);
    const userMsg: Message = {
      role: 'user',
      content: invocation.prompt,
      timestamp: Date.now()
    };
    
    this.memoryLogs.update(logs => [...logs, userMsg]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: invocation.prompt,
          context: {
            ...invocation.context,
            sessionId: invocation.sessionId || 'session_webos_default',
            framework: 'blades-go-client-wrapper'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Blades execution failed with status ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.reply || 'Execution completed successfully in Blades framework.';

      const assistantMsg: Message = {
        role: 'assistant',
        content: assistantText,
        timestamp: Date.now()
      };

      this.memoryLogs.update(logs => [...logs, assistantMsg]);
      this.isExecuting.set(false);
      return assistantMsg;
    } catch (err: unknown) {
      this.isExecuting.set(false);
      const errorMsg: Message = {
        role: 'assistant',
        content: `Error executing Blades agent: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
      this.memoryLogs.update(logs => [...logs, errorMsg]);
      return errorMsg;
    }
  }

  public clearMemory(): void {
    this.memoryLogs.set([]);
  }
}
