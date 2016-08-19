import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/common';
import { HiddenField } from '../models';

@Component({
  selector: 'wiz-hidden-field',
  templateUrl: 'app/static/src/fields/components/hidden.html',
})
export class HiddenFieldComponent {
  @Input() fieldModel: HiddenField;
  @Input() control: AbstractControl;
}
