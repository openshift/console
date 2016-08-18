import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
 } from '@angular/core';

@Directive({
  selector: '[wiz-focus]'
})
export class FocusDirective implements AfterViewInit {
  @Input('wiz-focus') focus: string | boolean;

  constructor(
    public el: ElementRef
  ) {}

  ngAfterViewInit(): void {
    if (this.focus === '' || this.focus) {
      (this.el.nativeElement as HTMLElement).focus();
    }
  }
}
