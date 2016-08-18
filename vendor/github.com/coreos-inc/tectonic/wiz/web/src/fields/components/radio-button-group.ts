import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/common';
import { RadioButtonGroupField } from '../models';
import { WizValidationErrorComponent } from '../../validators/validation-error';

@Component({
  selector: 'wiz-radio-button-group-field',
  templateUrl: 'app/static/src/fields/components/radio-button-group.html',
  styleUrls: ['app/static/src/fields/components/radio-button-group.css'],
  directives: [WizValidationErrorComponent],
})
export class RadioButtonGroupFieldComponent {
  @Input() fieldModel: RadioButtonGroupField;
  @Input() control: AbstractControl;
}
