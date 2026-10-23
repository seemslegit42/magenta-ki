import { Directive, ElementRef, output, inject } from '@angular/core';

@Directive({
  selector: '[appDraggable]',
  standalone: true,
  host: {
    '(mousedown)': 'onMouseDown($event)',
    '(window:mousemove)': 'onMouseMove($event)',
    '(window:mouseup)': 'onMouseUp()',
  },
})
export class DraggableDirective {
  private isDragging = false;
  private offset = { x: 0, y: 0 };
  
  dragMove = output<{ x: number, y: number }>();

  private el = inject(ElementRef);

  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.offset = { x: event.clientX - this.el.nativeElement.getBoundingClientRect().left, y: event.clientY - this.el.nativeElement.getBoundingClientRect().top };
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.dragMove.emit({ x: event.clientX - this.offset.x, y: event.clientY - this.offset.y });
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }
}
