import { Component, Input, ViewContainerRef, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { AbstractControl, Control, ControlGroup } from '@angular/common';
import { TextAreaField } from '../models';
import { WizValidationErrorComponent } from '../../validators/validation-error';
import { FocusDirective } from '../../focus/focus.directive';
import { UploadFileComponent } from '../../upload-file/upload-file.component';
import { MarkedComponent } from '../../marked/marked.component';

@Component({
  selector: 'wiz-textarea-field',
  templateUrl: 'app/static/src/fields/components/textarea.html',
  directives: [
    FocusDirective,
    MarkedComponent,
    UploadFileComponent,
    WizValidationErrorComponent,
  ],
})
export class TextAreaFieldComponent {
  @Input() fieldModel: TextAreaField;
  @Input() control: AbstractControl;
  @Input() autofocus: boolean;
}
