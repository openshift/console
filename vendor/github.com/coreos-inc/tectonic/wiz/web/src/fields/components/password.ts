import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { AbstractControl } from '@angular/common';
import { PasswordField } from '../models';
import { WizValidationErrorComponent } from '../../validators/validation-error';
import { FocusDirective } from '../../focus/focus.directive';

@Component({
  selector: 'wiz-password-field',
  templateUrl: 'app/static/src/fields/components/password.html',
  directives: [
    FocusDirective,
    WizValidationErrorComponent,
  ],
})
export class PasswordFieldComponent {
  @Input() fieldModel: PasswordField;
  @Input() control: AbstractControl;
  @Input() autofocus: boolean;
}
