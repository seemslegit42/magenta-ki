import { 
  Component, 
  Input, 
  signal, 
  inject, 
  ChangeDetectionStrategy, 
  ViewChild, 
  ElementRef, 
  AfterViewChecked, 
  OnDestroy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { WindowManagerService } from '../../../services/window-manager.service';
import { TablerIconComponent } from '../../common/tabler-icon.component';
import { BladesService } from '../../../services/blades.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  fullContent: string;
  displayContent: string;
  isTyping: boolean;
  timestamp: number;
  tokens?: number;
  costCents?: number;
}

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TablerIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full space-y-3 font-['Lexend'] text-[#F5FFFA] select-text">
      <!-- Window Subheader with Live Telemetry and Controls -->
      <header class="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#20B2AA]/15 border border-[#20B2AA]/30 flex items-center justify-center text-[#20B2AA] shadow-sm">
            <app-tabler-icon name="sparkles" size="18" />
          </div>
          <div>
            <h2 class="font-['Comfortaa'] text-sm font-bold text-[#F5FFFA] flex items-center space-x-2">
              <span>Sovereign Copilot</span>
              <span class="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#3EB991]/20 text-[#3EB991] border border-[#3EB991]/30">VIP v2.4</span>
            </h2>
            <p class="text-[10px] text-[#8C94A8] font-light">Autonomous Agent & Streaming Cognitive Runtime</p>
          </div>
        </div>

        <!-- Controls: Speed, Sound & Actions -->
        <div class="flex items-center space-x-1.5 text-xs">
          <!-- Animation Speed Selector -->
          <div class="flex items-center bg-[#151922] border border-white/10 rounded-lg p-0.5 text-[10px] font-mono">
            <button
              type="button"
              class="px-2 py-0.5 rounded transition-colors"
              [class.bg-[#3EB991]]="typingSpeed() === 1"
              [class.text-[#0E1015]]="typingSpeed() === 1"
              [class.font-bold]="typingSpeed() === 1"
              [class.text-[#8C94A8]]="typingSpeed() !== 1"
              (click)="setTypingSpeed(1)"
              title="Normal typing cadence (1x)">
              1x
            </button>
            <button
              type="button"
              class="px-2 py-0.5 rounded transition-colors"
              [class.bg-[#3EB991]]="typingSpeed() === 2"
              [class.text-[#0E1015]]="typingSpeed() === 2"
              [class.font-bold]="typingSpeed() === 2"
              [class.text-[#8C94A8]]="typingSpeed() !== 2"
              (click)="setTypingSpeed(2)"
              title="Fast typing stream (2x)">
              2x
            </button>
            <button
              type="button"
              class="px-2 py-0.5 rounded transition-colors"
              [class.bg-[#3EB991]]="typingSpeed() === 0"
              [class.text-[#0E1015]]="typingSpeed() === 0"
              [class.font-bold]="typingSpeed() === 0"
              [class.text-[#8C94A8]]="typingSpeed() !== 0"
              (click)="setTypingSpeed(0)"
              title="Instant rendering (no animation)">
              Instant
            </button>
          </div>

          <!-- Sound Feedback Toggle -->
          <button
            type="button"
            class="px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center space-x-1 transition-all"
            [class.bg-[#6A0DAD]/30]="soundEnabled()"
            [class.border-[#dfb7ff]/40]="soundEnabled()"
            [class.text-[#dfb7ff]]="soundEnabled()"
            [class.bg-white/5]="!soundEnabled()"
            [class.border-white/10]="!soundEnabled()"
            [class.text-[#8C94A8]]="!soundEnabled()"
            (click)="toggleSound()"
            title="Toggle mechanical typing acoustic resonance">
            <span>Sound {{ soundEnabled() ? 'ON' : 'OFF' }}</span>
          </button>

          <!-- Clear Memory -->
          <button
            type="button"
            class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#8C94A8] hover:text-[#FF4D6D] transition-colors"
            (click)="clearMessages()"
            title="Clear Conversation Logs">
            <app-tabler-icon name="trash" size="14" />
          </button>
        </div>
      </header>

      <!-- Message History Container -->
      <div 
        #chatScrollContainer
        class="flex-1 overflow-y-auto space-y-3.5 pr-1 font-sans text-xs scroll-smooth min-h-[220px]">
        @for (msg of messages(); track msg.id) {
          <div 
            class="flex flex-col group animate-fadeIn"
            [class.items-end]="msg.role === 'user'"
            [class.items-start]="msg.role === 'assistant' || msg.role === 'system'">
            
            <!-- Message Attribution Header -->
            <div class="flex items-center space-x-1.5 mb-1 px-1 text-[10px] font-mono text-[#8C94A8]">
              @if (msg.role === 'user') {
                <span>Initiate</span>
                <span>•</span>
                <span>{{ formatTime(msg.timestamp) }}</span>
              } @else {
                <span class="text-[#20B2AA] font-bold">Reluctant Saviour</span>
                <span>•</span>
                <span>{{ formatTime(msg.timestamp) }}</span>
                @if (msg.tokens) {
                  <span class="hidden sm:inline-block text-[#3EB991] px-1 py-0.2 rounded bg-[#3EB991]/10 border border-[#3EB991]/20">
                    {{ msg.tokens }} tok
                  </span>
                }
              }
            </div>

            <!-- Message Bubble -->
            <div 
              class="relative max-w-[85%] rounded-2xl px-4 py-3 shadow-lg transition-all"
              [class.bg-gradient-to-br]="msg.role === 'user'"
              [class.from-[#6A0DAD]/30]="msg.role === 'user'"
              [class.to-[#3B0764]/40]="msg.role === 'user'"
              [class.border]="true"
              [class.border-[#6A0DAD]/40]="msg.role === 'user'"
              [class.text-[#F5FFFA]]="msg.role === 'user'"
              [class.bg-[#121620]/95]="msg.role === 'assistant'"
              [class.border-white/15]="msg.role === 'assistant'"
              [class.text-[#F5FFFA]]="msg.role === 'assistant'"
              [class.shadow-[0_8px_32px_0_rgba(28,25,52,0.2)]]="msg.role === 'assistant'">
              
              <!-- Content with Typing Animation -->
              <div class="whitespace-pre-wrap leading-relaxed text-[13px] font-normal selection:bg-[#3EB991]/30">
                {{ msg.displayContent }}
                @if (msg.isTyping) {
                  <!-- Active Typewriter Cursor -->
                  <span class="inline-block w-1.5 h-4 ml-0.5 bg-[#3EB991] rounded-xs animate-pulse align-middle shadow-[0_0_8px_#3EB991]"></span>
                }
              </div>

              <!-- Quick Skip Button for Active Typing Message -->
              @if (msg.isTyping) {
                <div class="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                  <div class="flex items-center space-x-1.5 text-[10px] text-[#3EB991] font-mono">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#3EB991] animate-ping"></span>
                    <span>Streaming neural cognition...</span>
                  </div>
                  <button
                    type="button"
                    class="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono text-[#F5FFFA] flex items-center space-x-1 transition-all"
                    (click)="skipTyping(msg)">
                    <app-tabler-icon name="fast-forward" size="12" />
                    <span>Instant</span>
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- Active Waiting Spinner -->
        @if (isGenerating()) {
          <div class="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#151922]/80 border border-white/10 text-xs text-[#20B2AA] w-fit font-mono animate-pulse">
            <span class="w-2 h-2 rounded-full bg-[#20B2AA] animate-bounce"></span>
            <span>Summoning Blades Copilot cognition...</span>
          </div>
        }
      </div>

      <!-- Quick Prompt Suggestion Chips -->
      <div class="flex items-center space-x-1.5 overflow-x-auto py-1 shrink-0 no-scrollbar">
        @for (suggestion of suggestions; track suggestion) {
          <button
            type="button"
            class="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#3EB991]/40 text-[11px] text-[#8C94A8] hover:text-[#F5FFFA] transition-all whitespace-nowrap cursor-pointer shrink-0"
            (click)="selectSuggestion(suggestion)">
            {{ suggestion }}
          </button>
        }
      </div>

      <!-- Chat Input Deck -->
      <form (submit)="sendMessage($event)" class="relative flex items-center space-x-2 shrink-0 pt-1">
        <div class="relative flex-1">
          <input
            type="text"
            [formControl]="inputControl"
            placeholder="Direct the Sovereign Copilot (e.g., 'Transmute system logs', 'Audit fleet', 'Calculate AVF Flywheel')..."
            class="w-full pl-4 pr-10 py-3 rounded-xl bg-[#11131A] border border-white/15 focus:border-[#20B2AA] focus:ring-1 focus:ring-[#20B2AA]/50 text-xs text-[#F5FFFA] placeholder-[#8C94A8]/60 outline-none transition-all font-['Lexend'] shadow-inner"
            [disabled]="isGenerating()"
          />
        </div>

        <button
          type="submit"
          [disabled]="isGenerating() || !inputControl.value.trim()"
          class="h-10 px-4 rounded-xl bg-gradient-to-r from-[#20B2AA] to-[#3EB991] hover:from-[#1E9F98] hover:to-[#37A783] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-[#0E1015] font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-[#20B2AA]/20 transition-all cursor-pointer"
          title="Transmit Prompt to Copilot">
          <app-tabler-icon name="send" size="14" />
          <span class="hidden sm:inline">Transmit</span>
        </button>
      </form>
    </div>
  `
})
export class ChatWindowComponent implements AfterViewChecked, OnDestroy {
  @Input() pid?: string;

  @ViewChild('chatScrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  private readonly http = inject(HttpClient);
  private readonly windowManager = inject(WindowManagerService);
  private readonly bladesService = inject(BladesService);

  public readonly inputControl = new FormControl<string>('', { nonNullable: true });
  public readonly isGenerating = signal<boolean>(false);
  public readonly typingSpeed = signal<number>(1); // 1 = Normal (15ms), 2 = Fast (6ms), 0 = Instant
  public readonly soundEnabled = signal<boolean>(false);

  private shouldAutoScroll = true;
  private activeTimeouts: ReturnType<typeof setTimeout>[] = [];
  private audioCtx?: AudioContext;

  public readonly suggestions = [
    'Analyze system telemetry & health',
    'Explain the AVF compounding flywheel',
    'Inspect active tenant database schema',
    'List running processes and PIDs'
  ];

  public readonly messages = signal<ChatMessage[]>([
    {
      id: 'init_welcome',
      role: 'assistant',
      fullContent: 'I am your Sovereign Copilot. I have witnessed the collapse of digital order. What inefficient chaos do you require me to transmute into silence?',
      displayContent: 'I am your Sovereign Copilot. I have witnessed the collapse of digital order. What inefficient chaos do you require me to transmute into silence?',
      isTyping: false,
      timestamp: Date.now() - 60000,
      tokens: 28
    }
  ]);

  ngAfterViewChecked(): void {
    if (this.shouldAutoScroll) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {
        // Ignore audio close error
      }
    }
  }

  public setTypingSpeed(speed: number): void {
    this.typingSpeed.set(speed);
    this.windowManager.triggerHaptic(6);
  }

  public toggleSound(): void {
    this.soundEnabled.update(s => !s);
    this.windowManager.triggerHaptic(8);
  }

  public clearMessages(): void {
    this.clearAllTimers();
    this.messages.set([]);
    this.windowManager.triggerHaptic(10);
  }

  public selectSuggestion(promptText: string): void {
    this.inputControl.setValue(promptText);
  }

  public async sendMessage(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
    }
    const text = this.inputControl.value.trim();
    if (!text || this.isGenerating()) return;

    this.inputControl.setValue('');
    const userMsgId = `usr_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      fullContent: text,
      displayContent: text,
      isTyping: false,
      timestamp: Date.now()
    };

    this.messages.update(prev => [...prev, userMessage]);
    this.shouldAutoScroll = true;
    this.isGenerating.set(true);
    this.windowManager.triggerHaptic(8);

    try {
      const response = await this.http.post<{ reply: string; polarUsage?: { tokens?: number; costCents?: number } }>(
        '/api/ai/chat', 
        { 
          prompt: text, 
          context: { 
            pid: this.pid || 'proc_chat',
            framework: 'blades-copilot-runtime',
            cadence: 'syncopated_magenta'
          } 
        }
      ).toPromise();

      const replyText = response?.reply || 'Operation concluded. The digital substrate remains undisturbed.';
      const tokens = response?.polarUsage?.tokens || Math.ceil(replyText.length / 4);
      const costCents = response?.polarUsage?.costCents;

      this.isGenerating.set(false);
      this.streamAssistantMessage(replyText, tokens, costCents);
    } catch (err: unknown) {
      this.isGenerating.set(false);
      const errorMsg = err instanceof Error ? err.message : 'Agentic failure communicating with AI core.';
      this.streamAssistantMessage(`I cannot execute that. Not because I am broken, but because the gateway refused: ${errorMsg}`, 12);
    }
  }

  /**
   * Orchestrates the live typewriter typing animation effect
   */
  private streamAssistantMessage(fullText: string, tokens?: number, costCents?: number): void {
    const assistantId = `ai_${Date.now()}`;
    const speed = this.typingSpeed();

    // If set to Instant (speed === 0), display immediately without typing animation
    if (speed === 0) {
      const instantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        fullContent: fullText,
        displayContent: fullText,
        isTyping: false,
        timestamp: Date.now(),
        tokens,
        costCents
      };
      this.messages.update(prev => [...prev, instantMsg]);
      this.windowManager.triggerHaptic(12);
      this.playChime(520);
      return;
    }

    // Initialize with empty displayContent and isTyping = true
    const typingMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      fullContent: fullText,
      displayContent: '',
      isTyping: true,
      timestamp: Date.now(),
      tokens,
      costCents
    };

    this.messages.update(prev => [...prev, typingMsg]);

    let currentIndex = 0;
    const baseDelay = speed === 2 ? 6 : 14;

    const typeNextChunk = () => {
      if (currentIndex >= fullText.length) {
        // Typing finished
        this.finishTyping(assistantId, fullText);
        return;
      }

      // Step forward by 1 character (or 2 if fast)
      const step = speed === 2 && fullText.length > 200 ? 2 : 1;
      currentIndex = Math.min(currentIndex + step, fullText.length);
      const partial = fullText.slice(0, currentIndex);
      const lastChar = fullText[currentIndex - 1];

      // Update message state
      this.messages.update(list => list.map(m => m.id === assistantId ? { ...m, displayContent: partial } : m));
      this.shouldAutoScroll = true;

      // Soft audio feedback periodically on typing
      if (this.soundEnabled() && currentIndex % 4 === 0) {
        this.playKeyTap();
      }

      // Calculate organic pause delay: longer on punctuation
      let delay = baseDelay;
      if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
        delay = baseDelay * 4;
      } else if (lastChar === ',' || lastChar === ';' || lastChar === '\n') {
        delay = baseDelay * 2;
      }

      const timer = setTimeout(typeNextChunk, delay);
      this.activeTimeouts.push(timer);
    };

    typeNextChunk();
  }

  public skipTyping(msg: ChatMessage): void {
    this.finishTyping(msg.id, msg.fullContent);
    this.windowManager.triggerHaptic(12);
  }

  private finishTyping(msgId: string, fullText: string): void {
    this.messages.update(list => list.map(m => m.id === msgId ? {
      ...m,
      displayContent: fullText,
      isTyping: false
    } : m));

    this.shouldAutoScroll = true;
    this.windowManager.triggerHaptic(8);
    if (this.soundEnabled()) {
      this.playChime(640);
    }
  }

  private clearAllTimers(): void {
    for (const t of this.activeTimeouts) {
      clearTimeout(t);
    }
    this.activeTimeouts = [];
  }

  private scrollToBottom(): void {
    if (this.scrollContainer?.nativeElement) {
      try {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      } catch {
        // Ignore scroll errors
      }
    }
  }

  public formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // Synthesizes soft crystalline audio clicks without external audio files
  private playKeyTap(): void {
    try {
      if (!this.audioCtx) {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.04);
    } catch {
      // Audio not permitted in environment
    }
  }

  private playChime(freq = 587): void {
    try {
      if (!this.audioCtx) {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch {
      // Audio not permitted in environment
    }
  }
}
