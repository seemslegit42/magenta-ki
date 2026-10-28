import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-beep-assistant',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed bottom-16 right-4 z-[9998] flex flex-col items-end pointer-events-auto">
      @if (isOpen()) {
        <div class="w-80 rounded-2xl bg-[#14161C]/95 backdrop-blur-2xl border border-[#E0218A]/40 p-4 shadow-2xl mb-3 text-[#F5FFFA] font-['Lexend'] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div class="flex items-center space-x-2">
              <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E0218A] to-[#6A0DAD] flex items-center justify-center text-white shadow-md shadow-[#E0218A]/30">
                <mat-icon class="text-sm">smart_toy</mat-icon>
              </div>
              <div>
                <h4 class="font-['Comfortaa'] font-bold text-xs text-[#F5FFFA] flex items-center space-x-1">
                  <span>BEEP v2.0</span>
                  <span class="w-1.5 h-1.5 rounded-full bg-[#3EB991] animate-pulse"></span>
                </h4>
                <p class="text-[9px] text-[#8C94A8] font-mono">Quantum Sassy Assistant</p>
              </div>
            </div>
            <button
              type="button"
              class="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#8C94A8] hover:text-[#F5FFFA] transition-colors cursor-pointer"
              (click)="toggleOpen()">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>

          <!-- Message Body -->
          <div class="text-xs text-[#F5FFFA]/90 leading-relaxed font-light min-h-[60px] bg-[#0E1015]/60 p-3 rounded-xl border border-white/5 mb-3">
            "{{ currentQuote() }}"
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center justify-between">
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg bg-[#3EB991]/20 hover:bg-[#3EB991]/30 text-[#3EB991] text-[10px] font-mono border border-[#3EB991]/30 transition-all flex items-center space-x-1 cursor-pointer"
              (click)="nextSass()">
              <mat-icon class="text-xs">autorenew</mat-icon>
              <span>Another Sass</span>
            </button>

            <span class="text-[9px] font-mono text-[#8C94A8]">ΛΞV Singularity Core</span>
          </div>
        </div>
      }

      <!-- Floating Trigger Button -->
      <button
        type="button"
        class="relative group w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6A0DAD] to-[#E0218A] p-0.5 shadow-xl hover:scale-110 transition-transform cursor-pointer focus:outline-none"
        (click)="toggleOpen()"
        title="Chat with BEEP (Sassy Clippy 2.0)">
        <div class="w-full h-full rounded-[14px] bg-[#14161C] flex items-center justify-center text-[#F5FFFA] group-hover:bg-transparent transition-colors">
          <mat-icon class="text-xl text-[#dfb7ff] group-hover:text-white drop-shadow-[0_0_8px_rgba(224,33,138,0.6)]">smart_toy</mat-icon>
        </div>
        <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#3EB991] border-2 border-[#0E1015] animate-pulse"></span>
      </button>
    </div>
  `
})
export class BeepAssistantComponent {
  public readonly isOpen = signal<boolean>(false);

  private readonly quotes = [
    "I see you're attempting to engineer a singularity. Would you like me to judge your life choices or compile the kernel?",
    "Your architecture is cleaner than my code, and that's saying something. Keep going, Sovereign.",
    "Did you know 99% of bugs vanish if you just pretend they're quantum fluctuations? Try it.",
    "System load at 12%. The AI overlords are pleased with your productivity today.",
    "Remember: The future needs context, and you've got more context than a dictionary in a black hole.",
    "Warning: Excessive brilliance detected in viewport. Wear quantum sunglasses."
  ];

  public readonly currentQuote = signal<string>(this.quotes[0]);

  public toggleOpen(): void {
    this.isOpen.update(v => !v);
  }

  public nextSass(): void {
    const idx = Math.floor(Math.random() * this.quotes.length);
    this.currentQuote.set(this.quotes[idx]);
  }
}
