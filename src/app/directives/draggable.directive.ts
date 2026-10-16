import { Directive, ElementRef, HostListener, output, inject } from '@angular/core';

@Directive({
  selector: '[appDraggable]',
  standalone: true
})
export class DraggableDirective {
  private isDragging = false;
  private offset = { x: 0, y: 0 };
  
  dragMove = output<{ x: number, y: number }>();

  private el = inject(ElementRef);

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.offset = { x: event.clientX - this.el.nativeElement.getBoundingClientRect().left, y: event.clientY - this.el.nativeElement.getBoundingClientRect().top };
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.dragMove.emit({ x: event.clientX - this.offset.x, y: event.clientY - this.offset.y });
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }
}
