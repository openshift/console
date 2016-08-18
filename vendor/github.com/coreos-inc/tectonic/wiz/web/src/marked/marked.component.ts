import {
  Component,
  Input,
} from '@angular/core';

import
  marked
from '../adapters/marked';

@Component({
  selector: 'wiz-marked',
  template: '<div *ngIf="markdown" [innerHTML]="compiledMarkdown"></div>'
})
export class MarkedComponent {
  @Input() markdown: string;

  get compiledMarkdown(): string {
    return marked(this.markdown);
  }
}
