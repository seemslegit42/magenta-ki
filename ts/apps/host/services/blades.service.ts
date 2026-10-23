import { Injectable, signal } from '@angular/core';
import { Agent, ModelProvider, Invocation, Message } from './blades.types';

@Injectable({
  providedIn: 'root'
})
export class BladesService implements Agent, ModelProvider {
  private agentName = signal<string>('Blades-lxvOS-Agent');
  private agentDescription = signal<string>('Blades agent wrapper for lxvOS.');
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

  public async generate(prompt: string, context?: Record<string, unknown>): Promise<{ text: string; polarUsage?: unknown }> {
    const result = await this.run({ prompt, context });
    return { text: result.content };
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Agent execution failed (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (!data.reply) {
        throw new Error('Agent failed to return a valid response structure');
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now()
      };

      this.memoryLogs.update(logs => [...logs, assistantMsg]);
      return assistantMsg;
    } catch (err: unknown) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `Agentic Fault: ${err instanceof Error ? err.message : 'Unknown critical error during execution'}`,
        timestamp: Date.now()
      };
      this.memoryLogs.update(logs => [...logs, errorMsg]);
      return errorMsg;
    } finally {
      this.isExecuting.set(false);
    }
  }

  public clearMemory(): void {
    this.memoryLogs.set([]);
  }
}
