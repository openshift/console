import { Component, Input } from '@angular/core';

@Component({
  selector: 'wiz-congratulations',
  templateUrl: 'app/static/src/wizard/congratulations.component.html',
  styleUrls: ['app/static/src/wizard/congratulations.component.css']
})
export class CongratulationsComponent {
  @Input() url: string;
}
