import { Directive, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[wiz-onbeforeunload]'
})
export class OnBeforeUnloadDirective implements OnInit, OnDestroy {
  oldOnBeforeUnload: (event: BeforeUnloadEvent) => string;

  ngOnInit() {
    this.oldOnBeforeUnload = window.onbeforeunload;
    window.onbeforeunload = this.onBeforeUnload;
  }

  ngOnDestroy() {
    window.onbeforeunload = this.oldOnBeforeUnload;
  }

  onBeforeUnload(event: BeforeUnloadEvent): string {
    // string doesn't matter much here as browsers deal with onbeforeunload
    // in different ways and in most cases use hard-coded messages
    return 'Changes you made may not be saved.';
  }
}
