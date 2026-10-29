import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabler-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      [attr.width]="size()" 
      [attr.height]="size()" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      [attr.stroke-width]="strokeWidth()" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      [class]="class()"
    >
      @switch (name()) {
        @case ('apps') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
          <path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
          <path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
          <path d="M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
        }
        @case ('store') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M3 21l18 0" />
          <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4" />
          <path d="M5 21l0 -10" />
          <path d="M19 21l0 -10" />
          <path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" />
        }
        @case ('network') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M6 16m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M18 16m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M12 8m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M6 13v-1a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v1" />
          <path d="M12 11v2" />
        }
        @case ('beep') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <!-- Verdigris syndicate mark: hex frame + telemetry B + patina node -->
          <path d="M12 2.8l6.9 4v8.4L12 19.6l-6.9-4V6.8L12 2.8z" />
          <path d="M9.25 8.25h2.35c1.05 0 1.65.55 1.65 1.35s-.6 1.35-1.65 1.35H9.25v-2.7z" />
          <path d="M9.25 11.85h2.55c1.15 0 1.85.65 1.85 1.55s-.7 1.55-1.85 1.55H9.25v-3.1z" />
          <path d="M9.25 8.25v7.15" />
          <circle cx="16.2" cy="16.4" r="1.05" fill="currentColor" stroke="none" />
          <path d="M14.8 14.9l1.9 1.9" stroke-width="1.35" />
        }
        @case ('hexagon') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M19.875 6.270c.715 .413 1.125 1.185 1.125 2.032v7.396c0 .847 -.41 1.62 -1.125 2.033l-6.875 3.964c-.715 .413 -1.595 .413 -2.31 0l-6.875 -3.964c-.715 -.413 -1.125 -1.186 -1.125 -2.033v-7.396c0 -.847 .41 -1.62 1.125 -2.033l6.875 -3.964c.715 -.413 1.595 -.413 2.31 0l6.875 3.964z" />
        }
        @case ('clock') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 12l3 2" />
          <path d="M12 7v5" />
        }
        @case ('terminal') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 7l5 5l-5 5" />
          <path d="M12 19l7 0" />
        }
        @case ('settings') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
          <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
        }
        @case ('shield') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
        }
        @case ('message') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M8 9h8" />
          <path d="M8 13h6" />
          <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
        }
        @case ('send') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M10 14l11 -11" />
          <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
        }
        @case ('sparkles') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
        }
        @case ('trash') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M4 7l16 0" />
          <path d="M10 11l0 6" />
          <path d="M14 11l0 6" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        }
        @case ('fast-forward') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M4 4l10 8l-10 8z" />
          <path d="M14 4l10 8l-10 8z" />
        }
        @case ('pin') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M9 4v6l-2 4v2h10v-2l-2 -4v-6" />
          <path d="M12 16l0 5" />
          <path d="M8 4l8 0" />
        }
        @case ('file-text') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
          <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
          <path d="M9 9l1 0" />
          <path d="M9 13l6 0" />
          <path d="M9 17l6 0" />
        }
        @case ('folder') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
        }
        @case ('database') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 6m-8 0a8 3 0 1 0 16 0a8 3 0 1 0 -16 0" />
          <path d="M4 6v6a8 3 0 0 0 16 0v-6" />
          <path d="M4 12v6a8 3 0 0 0 16 0v-6" />
        }
        @case ('category') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M4 4h6v6h-6z" />
          <path d="M14 4h6v6h-6z" />
          <path d="M4 14h6v6h-6z" />
          <circle cx="17" cy="17" r="3" />
        }
        @case ('check') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 12l5 5l10 -10" />
        }
        @default {
          <circle cx="12" cy="12" r="9" />
        }
      }
    </svg>
  `
})
export class TablerIconComponent {
  readonly name = input.required<string>();
  readonly size = input<string>('24');
  readonly strokeWidth = input<string>('2');
  readonly class = input<string>('');
}
