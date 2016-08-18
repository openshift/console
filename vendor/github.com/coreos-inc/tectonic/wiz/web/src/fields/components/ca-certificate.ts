import { Component, Input } from '@angular/core';
import { Control, ControlGroup, Validators } from '@angular/common';
import { Http } from '@angular/http';
import { WizValidators } from '../../validators/validators';
import { WizValidationErrorComponent } from '../../validators/validation-error';
import { CaCertificateField, CaCertificateType } from '../models';
import { ErrorService } from '../../error/error.service';
import { WizardService } from '../../wizard/wizard.service';
import saveAs from '../../adapters/file-saver';
import { FocusDirective } from '../../focus/focus.directive';
import { UploadFileComponent } from '../../upload-file/upload-file.component';

@Component({
  selector: 'wiz-ca-certificate-field',
  templateUrl: 'app/static/src/fields/components/ca-certificate.html',
  directives: [
    FocusDirective,
    UploadFileComponent,
    WizValidationErrorComponent,
  ],
})
export class CaCertificateFieldComponent {
  @Input() fieldModel: CaCertificateField;
  @Input() control: ControlGroup;
  wrappingControl: ControlGroup = new ControlGroup({
    type: new Control(null, Validators.required),
    organizationName: new Control(null, Validators.required),
    commonName: new Control(null, Validators.required),
    certificate: new Control(null, Validators.compose([Validators.required, WizValidators.certificate])),
  });

  CA_CERT_PLACEHOLDER: string = 'Paste your certificate here. It should start with:\n\n-----BEGIN CERTIFICATE-----\n\nIt should end with:\n\n-----END CERTIFICATE-----';

  constructor(
    public http: Http,
    public errorService: ErrorService,
    public wizardService: WizardService
  ) { }

  get CaCertificateType(): any {
    return CaCertificateType;
  }

  get isGenerateCaCertificateAndPrivateKeyButtonDisabled(): boolean {
    // neither organization name nor common name are valid
    return !this.wrappingControl.find('organizationName').valid
      || !this.wrappingControl.find('commonName').valid;
  }

  get isCaCertificateAndPrivateKeyGenerated(): boolean {
    return this.wrappingControl.find('certificate').valid
      || this.wrappingControl.find('privateKey').valid;
  }

  ngOnInit(): void {
    this.wrappingControl.valueChanges.subscribe(() => this.toControl());
    this.fromControl();
  }

  toControl(): void {
    let type: string = this.wrappingControl.find('type').value;
    (this.control.find(this.fieldModel.typeField.id) as Control).updateValue(type);

    if (type === CaCertificateType.SelfSigned) {
      (this.control.find(this.fieldModel.organizationNameField.id) as Control).updateValue(this.wrappingControl.find('organizationName').value);
      (this.control.find(this.fieldModel.commonNameField.id) as Control).updateValue(this.wrappingControl.find('commonName').value);
    }
    else {
      (this.control.find(this.fieldModel.certField.id) as Control).updateValue(this.wrappingControl.find('certificate').value);
    }
  }

  fromControl(): void {
    let type: string = this.control.find(this.fieldModel.typeField.id).value;
    (this.wrappingControl.find('type') as Control).updateValue(type);

    if (type === CaCertificateType.SelfSigned) {
      (this.wrappingControl.find('organizationName') as Control).updateValue(this.control.find(this.fieldModel.organizationNameField.id).value);
      (this.wrappingControl.find('commonName') as Control).updateValue(this.control.find(this.fieldModel.commonNameField.id).value);
    }
    else {
      (this.wrappingControl.find('certificate') as Control).updateValue(this.control.find(this.fieldModel.certField.id).value);
    }
  }

  useSelfSignedCaCertificate(): void {
    this.setCaCertificateType(CaCertificateType.SelfSigned);
  }

  useOwnedCaCertificate(): void {
    this.setCaCertificateType(CaCertificateType.Owned);
  }

  setCaCertificateType(type: string): void {
    (this.wrappingControl.find('type') as Control).updateValue(type);
    (this.wrappingControl.find('organizationName') as Control).updateValue(null);
    (this.wrappingControl.find('commonName') as Control).updateValue(null);
    (this.wrappingControl.find('certificate') as Control).updateValue(null);
  }
}
