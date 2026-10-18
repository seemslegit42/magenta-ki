import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabler-icon',
  standalone: true,
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
