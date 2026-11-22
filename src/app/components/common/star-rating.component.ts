import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TablerIconComponent } from './tabler-icon.component';

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Immediate Work',
  2: 'Below Expectations',
  3: 'Acceptable Experience',
  4: 'Very Good',
  5: 'Exceptional',
};

@Component({
  selector: 'app-star-rating',
  imports: [CommonModule, TablerIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex flex-wrap items-center gap-2"
      [attr.role]="readonly() ? 'img' : 'radiogroup'"
      [attr.aria-label]="readonly() ? 'Rating ' + value() + ' out of 5 stars' : 'Select rating from 1 to 5 stars'"
      (keydown)="handleKeyDown($event)"
    >
      <div class="inline-flex items-center gap-1">
        @for (star of stars; track star) {
          @if (readonly()) {
            <span
              class="inline-flex items-center justify-center p-0.5"
              [class.text-[#3EB991]]="star <= value()"
              [class.text-[#8C94A8]/35]="star > value()"
            >
              <app-tabler-icon [name]="star <= value() ? 'star-filled' : 'star'" [size]="iconSize()" />
            </span>
          } @else {
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="value() === star"
              [attr.aria-label]="star + (star === 1 ? ' star' : ' stars') + ' - ' + getLabel(star)"
              (click)="selectRating(star)"
              (mouseenter)="hoveredStar.set(star)"
              (mouseleave)="hoveredStar.set(0)"
              class="p-1.5 rounded-lg transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB991]"
              [class.text-[#3EB991]]="star <= activeDisplayValue()"
              [class.scale-110]="hoveredStar() === star"
              [class.text-[#8C94A8]/50]="star > activeDisplayValue()"
              [class.hover:text-[#3EB991]]="star > activeDisplayValue()"
            >
              <app-tabler-icon [name]="star <= activeDisplayValue() ? 'star-filled' : 'star'" [size]="iconSize()" />
            </button>
          }
        }
      </div>

      @if (showLabel() && activeDisplayValue() > 0) {
        <span class="text-xs font-['Lexend'] text-[#8C94A8] tabular-nums">
          {{ activeDisplayValue() }}/5 · {{ getLabel(activeDisplayValue()) }}
        </span>
      }
    </div>
  `,
})
export class StarRatingComponent {
  readonly value = input<number>(0);
  readonly readonly = input<boolean>(false);
  readonly iconSize = input<string>('20');
  readonly showLabel = input<boolean>(true);
  readonly ratingChange = output<number>();

  public readonly stars = [1, 2, 3, 4, 5] as const;
  public readonly hoveredStar = signal<number>(0);

  public readonly activeDisplayValue = computed(() =>
    this.hoveredStar() > 0 ? this.hoveredStar() : this.value(),
  );

  public getLabel(star: number): string {
    return RATING_LABELS[star] || '';
  }

  public selectRating(star: number): void {
    if (this.readonly()) return;
    this.ratingChange.emit(star);
  }

  public handleKeyDown(event: KeyboardEvent): void {
    if (this.readonly()) return;
    const current = this.value() || 0;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectRating(Math.min(5, current + 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectRating(Math.max(1, current - 1));
    } else if (['1', '2', '3', '4', '5'].includes(event.key)) {
      event.preventDefault();
      this.selectRating(Number(event.key));
    }
  }
}
