import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { AbstractControl } from '@angular/common';
import { TextField } from '../models';
import { WizValidationErrorComponent } from '../../validators/validation-error';
import { FocusDirective } from '../../focus/focus.directive';

@Component({
  selector: 'wiz-text-field',
  templateUrl: 'app/static/src/fields/components/text.html',
  directives: [
    FocusDirective,
    WizValidationErrorComponent,
  ],
})
export class TextFieldComponent {
  @Input() fieldModel: TextField;
  @Input() control: AbstractControl;
  @Input() autofocus: boolean;
}
