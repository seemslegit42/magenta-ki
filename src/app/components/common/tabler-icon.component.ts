import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-tabler-icon',
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
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('apps') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
          <path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
          <path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
          <path d="M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
        }
        @case ('store') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 21l18 0" />
          <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4" />
          <path d="M5 21l0 -10" />
          <path d="M19 21l0 -10" />
          <path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" />
        }
        @case ('network') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 16m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M18 16m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M12 8m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M6 13v-1a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v1" />
          <path d="M12 11v2" />
        }
        @case ('hexagon') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M19.875 6.270c.715 .413 1.125 1.185 1.125 2.032v7.396c0 .847 -.41 1.62 -1.125 2.033l-6.875 3.964c-.715 .413 -1.595 .413 -2.31 0l-6.875 -3.964c-.715 -.413 -1.125 -1.186 -1.125 -2.033v-7.396c0 -.847 .41 -1.62 1.125 -2.033l6.875 -3.964c.715 -.413 1.595 -.413 2.31 0l6.875 3.964z" />
        }
        @case ('clock') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 12l3 2" />
          <path d="M12 7v5" />
        }
        @case ('terminal') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 7l5 5l-5 5" />
          <path d="M12 19l7 0" />
        }
        @case ('settings') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
          <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
        }
        @case ('shield') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
        }
        @case ('shield-check') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06" />
          <path d="M15 19l2 2l4 -4" />
        }
        @case ('message') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M8 9h8" />
          <path d="M8 13h6" />
          <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
        }
        @case ('send') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10 14l11 -11" />
          <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
        }
        @case ('sparkles') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
        }
        @case ('trash') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M4 7l16 0" />
          <path d="M10 11l0 6" />
          <path d="M14 11l0 6" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        }
        @case ('fast-forward') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M4 4l10 8l-10 8z" />
          <path d="M14 4l10 8l-10 8z" />
        }
        @case ('git-branch') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M7 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
          <path d="M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
          <path d="M17 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
          <path d="M7 8l0 8" />
          <path d="M9 18h6a2 2 0 0 0 2 -2v-5" />
          <path d="M14 14l3 -3l3 3" />
        }
        @case ('check') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 12l5 5l10 -10" />
        }
        @case ('x') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M18 6l-12 12" />
          <path d="M6 6l12 12" />
        }
        @case ('alert-triangle') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 9v4" />
          <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
          <path d="M12 16h.01" />
        }
        @case ('clipboard-check') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
          <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
          <path d="M9 14l2 2l4 -4" />
        }
        @case ('printer') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" />
          <path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" />
          <path d="M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" />
        }
        @case ('rocket') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3" />
          <path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3" />
          <path d="M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        }
        @case ('server') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 4m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" />
          <path d="M3 12m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" />
          <path d="M7 8l0 .01" />
          <path d="M7 16l0 .01" />
        }
        @case ('file-check') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
          <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
          <path d="M9 15l2 2l4 -4" />
        }
        @case ('refresh') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
        }
        @case ('player-play') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M7 4v16l13 -8z" />
        }
        @case ('layers') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 4l-8 4l8 4l8 -4l-8 -4" />
          <path d="M4 12l8 4l8 -4" />
          <path d="M4 16l8 4l8 -4" />
        }
        @case ('star') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
        }
        @case ('star-filled') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path
            fill="currentColor"
            stroke="none"
            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"
          />
        }
        @case ('bug') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M9 9v-1a3 3 0 0 1 6 0v1" />
          <path d="M8 9h8a6 6 0 0 1 1 3v3a5 5 0 0 1 -10 0v-3a6 6 0 0 1 1 -3" />
          <path d="M3 13l4 0" />
          <path d="M17 13l4 0" />
          <path d="M12 20l0 -6" />
          <path d="M4 19l3.35 -2" />
          <path d="M20 19l-3.35 -2" />
          <path d="M4 7l3.75 2.4" />
          <path d="M20 7l-3.75 2.4" />
        }
        @case ('bulb') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7" />
          <path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3" />
          <path d="M9.7 17l4.6 0" />
        }
        @case ('gauge') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
          <path d="M13.41 10.59l2.59 -2.59" />
          <path d="M7 12a5 5 0 0 1 5 -5" />
        }
        @case ('plug') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M9.785 6l8.215 8.215l-2.054 2.054a5.81 5.81 0 1 1 -8.215 -8.215l2.054 -2.054z" />
          <path d="M4 20l3.5 -3.5" />
          <path d="M15 4l-3.5 3.5" />
          <path d="M20 9l-3.5 3.5" />
        }
        @case ('activity') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 12h4l3 8l4 -16l3 8h4" />
        }
        @case ('lock') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z" />
          <path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
          <path d="M8 11v-4a4 4 0 1 1 8 0v4" />
        }
        @case ('bolt') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
        }
        @case ('download') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
          <path d="M7 11l5 5l5 -5" />
          <path d="M12 4l0 12" />
        }
        @case ('thumb-up') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" />
        }
        @case ('filter') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" />
        }
        @case ('message-report') {
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
          <path d="M12 8v3" />
          <path d="M12 14v.01" />
        }
        @default {
          <circle cx="12" cy="12" r="9" />
        }
      }
    </svg>
  `,
})
export class TablerIconComponent {
  readonly name = input.required<string>();
  readonly size = input<string>('24');
  readonly strokeWidth = input<string>('2');
  readonly class = input<string>('');
}
