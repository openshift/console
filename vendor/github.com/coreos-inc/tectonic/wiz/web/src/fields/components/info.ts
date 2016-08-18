import { Component, Input } from '@angular/core';
import { ControlGroup, AbstractControl } from '@angular/common';
import { InfoField } from '../models';

@Component({
  selector: 'wiz-info-field',
  templateUrl: 'app/static/src/fields/components/info.html',
})
export class InfoFieldComponent {
  @Input() fieldModel: InfoField;
  @Input() control: AbstractControl;
}
