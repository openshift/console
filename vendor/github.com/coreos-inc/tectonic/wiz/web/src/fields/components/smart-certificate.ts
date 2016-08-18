import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/common';
import { SmartCertificateField } from '../models';
import { WizValidationErrorComponent } from '../../validators/validation-error';
import { TemplateComponent } from '../../template/template.component';
import { CaCertificateType } from '../models';
import { WizardService } from '../../wizard/wizard.service';
import { FocusDirective } from '../../focus/focus.directive'
import { UploadFileComponent } from '../../upload-file/upload-file.component';

@Component({
  selector: 'wiz-smart-certificate-field',
  templateUrl: 'app/static/src/fields/components/smart-certificate.html',
  directives: [
    FocusDirective,
    TemplateComponent,
    UploadFileComponent,
    WizValidationErrorComponent,
  ],
})
export class SmartCertificateFieldComponent {
  model: { template: string, wizard: any };
  @Input() fieldModel: SmartCertificateField;
  @Input() control: AbstractControl;

  constructor(
    public wizardService: WizardService
  ) { }

  ngOnInit() {
    let descriptionProperty: string = this.useSelfSignedCertificates ? 'selfSignedCertificate' : 'ownedCertificate';
    this.model = {
      template: (this.fieldModel.description as {})[descriptionProperty],
      wizard: this.wizardService.wizard.value
    };
  }

  get useSelfSignedCertificates(): boolean {
    let caType = this.wizardService.wizard.wizardControl.find(this.fieldModel.selfSignedCertificate.caCertificateSelector.type).value;
    return caType === CaCertificateType.SelfSigned;
  }
}
