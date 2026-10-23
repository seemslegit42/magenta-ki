import { Component, Input, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface TerminalLog {
  time: string;
  prefix: string;
  text: string;
  type: 'system' | 'user' | 'ai' | 'error';
}

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="space-y-4 h-full flex flex-col">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h2 class="font-display text-lg font-bold text-white flex items-center space-x-2">
            <span class="material-icons text-[#FF2A9D]">terminal</span>
            <span>WebOS Terminal & AI Copilot</span>
          </h2>
          <p class="text-xs text-[#8C94A8]">Direct shell execution and Gemini AI-powered autonomous agent diagnostics.</p>
        </div>
        <button
          class="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-[#8C94A8] hover:text-white"
          (click)="clearLogs()">
          Clear Logs
        </button>
      </div>

      <!-- Terminal Output Screen -->
      <div #scrollContainer class="flex-1 bg-[#090A0F] border border-white/10 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-3 shadow-inner min-h-[260px]">
        @for (entry of logs(); track entry.text) {
          <div [class.text-[#3EB991]]="entry.type === 'system'" [class.text-[#20B2AA]]="entry.type === 'ai'" [class.text-white]="entry.type === 'user'" [class.text-[#FF4D6D]]="entry.type === 'error'">
            <span class="text-[#8C94A8]">[{{ entry.time }}]</span> 
            <span class="font-bold">{{ entry.prefix }}</span> 
            <span class="whitespace-pre-wrap">{{ entry.text }}</span>
          </div>
        }
        @if (isLoading()) {
          <div class="text-[#FF2A9D] flex items-center space-x-2 animate-pulse">
            <span class="material-icons text-xs animate-spin">refresh</span>
            <span>Gemini AI Agent processing autonomous task...</span>
          </div>
        }
      </div>

      <!-- Input Bar -->
      <div class="flex items-center space-x-2">
        <span class="text-[#E0218A] font-mono font-bold">$</span>
        <input
          type="text"
          class="flex-1 bg-[#151922] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#E0218A]"
          placeholder="Type command (e.g., 'help', 'status', 'ai refactor workspace', 'turso sync')..."
          [(ngModel)]="commandInput"
          (keydown.enter)="executeCommand()" />
        <button
          class="px-4 py-2.5 rounded-xl bg-[#E0218A] hover:bg-[#FF2A9D] text-white text-xs font-semibold transition-colors shadow-lg flex items-center space-x-1"
          (click)="executeCommand()">
          <span class="material-icons text-xs">send</span>
          <span>Run</span>
        </button>
      </div>
    </div>
  `
})
export class TerminalComponent {
  @Input({ required: true }) pid!: string;
  private http = inject(HttpClient);

  protected commandInput = '';
  protected isLoading = signal(false);

  protected logs = signal<TerminalLog[]>([
    { time: new Date().toLocaleTimeString(), prefix: 'sys>', text: 'Verdigris Cloud OS Terminal initialized (VIP v2.4 Magenta Augmented).', type: 'system' },
    { time: new Date().toLocaleTimeString(), prefix: 'sys>', text: 'Type "help" for available commands or ask the AI Copilot ("ai [prompt]").', type: 'system' }
  ]);

  public clearLogs(): void {
    this.logs.set([]);
  }

  public async executeCommand(): Promise<void> {
    const cmd = this.commandInput.trim();
    if (!cmd) return;

    const time = new Date().toLocaleTimeString();
    this.logs.update(list => [...list, { time, prefix: 'usr>', text: cmd, type: 'user' }]);
    this.commandInput = '';

    if (cmd === 'help') {
      this.logs.update(list => [...list, {
        time: new Date().toLocaleTimeString(),
        prefix: 'sys>',
        text: 'Available Commands:\n- help: Show this guide\n- status: Display active PIDs and Turso edge metrics\n- clear: Clear terminal logs\n- ai [prompt]: Query the Gemini AI Autonomous Agent & Copilot',
        type: 'system'
      }]);
      return;
    }

    if (cmd === 'status') {
      this.logs.update(list => [...list, {
        time: new Date().toLocaleTimeString(),
        prefix: 'sys>',
        text: 'Active PIDs: 6 | Memory: 42.4 MB | OPFS WASM Status: Operational | Turso Edge Mesh: Connected',
        type: 'system'
      }]);
      return;
    }

    if (cmd.startsWith('ai ')) {
      const prompt = cmd.slice(3).trim();
      this.isLoading.set(true);
      try {
        const res = await this.http.post<{ reply: string }>('/api/ai/chat', { prompt, context: { pid: this.pid } }).toPromise();
        const fullReply = res?.reply || 'Task completed successfully.';
        this.isLoading.set(false);

        // Streaming typing effect into terminal log
        const logIndex = this.logs().length;
        const time = new Date().toLocaleTimeString();
        this.logs.update(list => [...list, { time, prefix: 'ai>', text: '', type: 'ai' }]);

        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex < fullReply.length) {
            charIndex = Math.min(charIndex + 2, fullReply.length);
            const partial = fullReply.slice(0, charIndex);
            this.logs.update(list => list.map((item, idx) => idx === logIndex ? { ...item, text: partial } : item));
          } else {
            clearInterval(typeInterval);
          }
        }, 12);
      } catch (err: unknown) {
        this.isLoading.set(false);
        const errorMsg = err instanceof Error ? err.message : 'Failed to reach Gemini AI backend service.';
        this.logs.update(list => [...list, {
          time: new Date().toLocaleTimeString(),
          prefix: 'err>',
          text: errorMsg,
          type: 'error'
        }]);
      }
      return;
    }

    // Default simulation
    this.logs.update(list => [...list, {
      time: new Date().toLocaleTimeString(),
      prefix: 'sys>',
      text: `Executed command "${cmd}" successfully in virtual sandbox.`,
      type: 'system'
    }]);
  }
}
