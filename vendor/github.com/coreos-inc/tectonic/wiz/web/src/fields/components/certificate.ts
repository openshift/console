import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { AbstractControl } from '@angular/common';
import { CertificateField } from '../models';
import { DynamicFieldComponent } from '../../wizard/dynamic-field.component';
import { Helper } from '../../helper/helper';

@Component({
  selector: 'wiz-certificate-field',
  templateUrl: 'app/static/src/fields/components/certificate.html',
  directives: [DynamicFieldComponent],
  providers: [Helper],
})
export class CertificateFieldComponent {
  @Input() fieldModel: CertificateField;
  @Input() control: AbstractControl;
  @Input() autofocus: boolean;
  @ViewChild('focusElement') focusElement: ElementRef;

  constructor(private _helper: Helper) {}

  ngAfterViewInit() {
    if (this.autofocus) {
      this._helper.focus(this.focusElement);
    }
  }

}
