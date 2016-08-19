import { ControlGroup, Control } from '@angular/common';
import { Http } from '@angular/http';

// TODO: investigate if there's a better way to import all classes from a module.
import {
  BaseField,
  CaCertificateField,
  CaCertificateType,
  CertificateField,
  HiddenField,
  IdentityConnectorField,
  IdentityEmailField,
  InfoField,
  PasswordField,
  PostgreSqlField,
  RadioButtonGroupField,
  SmartCertificateField,
  TextAreaField,
  TextField,
} from '../fields/models';

export interface MetadataConfig {
  submitEndpoint?: string;
  statusEndpoint?: string;
  caCertificate?: {
    typeFrom?: string;
    certificateFrom?: string;
    privateKeyFrom?: string;
  }
}

export interface LaunchFormConfig {
  urlFrom: string;
}

// Typed representation of the JSON manifest that is loaded upon initialization.
export interface Manifest {
  metadata: MetadataConfig;
  forms: FormConfig[];
  launchForm: LaunchFormConfig;
}

// Top-level installation/configuration Wizard.
// This is the main object that orchestrates the install flow.
export class Wizard {
  manifest: Manifest;
  metadata: MetadataConfig;
  forms: WizForm[];
  welcomeWizForm: WelcomeWizForm;
  backupFilesWizForm: BackupFilesWizForm;
  launchWizForm: LaunchWizForm;
  wizardControl: ControlGroup;
  private _activeFormIndex: number;

  constructor(manifest: Manifest) {
    this.manifest = manifest;
    this.metadata = manifest.metadata;
    this.forms = [].concat(
      // welcome
      this.welcomeWizForm = new WelcomeWizForm(),

      // forms*
      manifest.forms.map(createForm),

      // backup files
      this.backupFilesWizForm = new BackupFilesWizForm(),

      // launch
      this.launchWizForm = new LaunchWizForm()
    );
  }

  get indexOfWelcomeWizForm(): number {
    return this.forms.indexOf(this.welcomeWizForm as WizForm);
  }

  get indexOfLastSubmittedWizForm(): number {
    let index: number = -1;
    this.forms.forEach((f, i) => index = f.isSubmitted ? i : index)
    return index;
  }

  get indexOfLaunchWizForm(): number {
    return this.forms.indexOf(this.launchWizForm as WizForm);
  }

  get value() {
    return this.wizardControl.value;
  }

  get payload() {
    let payload = {};
    const flattenField = (f, fv, idPrefix = '') => {
      if (f.bypass) {
        return;
      }

      if (f.fields.length) {
        return f.fields.forEach(subField => flattenField(subField, fv[f.id], f.id + '.'));
      }

      if (fv[f.id] == null) {
        return;
      }

      let val = payload[idPrefix + f.id] = {
        key: f.id,
        value: '' + fv[f.id],
      };

      if (f.k8s) {
        val['namespace'] = f.k8s.namespace || null;
        val['name'] = f.k8s.name || null;
        val['kind'] = f.k8s.kind || null;
        val['type'] = f.k8s.type || null;
        val['encoding'] = f.k8s.encoding || null;
      }
    };

    this.forms.forEach(frm => {
      frm.fields.forEach(f => flattenField(f, frm.value));
    });

    return payload;
  }

  get activeFormIndex(): number {
    return this._activeFormIndex;
  }

  get nextFormIndex(): number {
    return this.activeFormIndex + 1;
  }

  get previousFormIndex(): number {
    return this.activeFormIndex - 1;
  }

  set activeFormIndex(i: number) {
    this._activeFormIndex = i;
  }

  get activeForm(): WizForm {
    return this.forms[this._activeFormIndex];
  }

  isFormNavigatable(form: WizForm): boolean {
    // first form/step is always navigatable
    let index = this.forms.indexOf(form);
    if (index === 0) {
      return true;
    }

    // has current form/step been submitted?
    if (form.isSubmitted) {
      return true;
    }

    // has previous form/step been submitted?
    let prevForm = this.forms[index - 1];
    return prevForm.isSubmitted;
  }

  get isSubmitted(): boolean {
    return this.forms.every(f => f.isSubmitted);
  }

}

// Config object used to initialize WizForm instances.
export interface FormConfig {
  id: string;
  type?: string;
  title: string;
  description?: string;
  fields?: BaseField<any>[];
}

// Represents each HTML form, of which there is 1 per page of the Wizard.
export class WizForm {
  id: string;
  type: string;
  title: string;
  description: string;
  fields: BaseField<any>[];
  formControl: ControlGroup;
  isSubmitted: boolean = false;

  constructor(cfg: FormConfig) {
    this.id = cfg.id;
    this.type = cfg.type || 'WizForm';
    this.title = cfg.title;
    this.description = cfg.description || '';
    this.fields = (cfg.fields || []).map(createField);
  }

  get visibleFields(): BaseField<any>[] {
    return this.fields.filter(f => !f.hidden);
  }

  get value() {
    return this.formControl.value;
  }

  isValid(wizard: Wizard): boolean {
    return this.formControl.valid;
  }

  onSubmit(http: Http, wizard: Wizard): Promise<void> {
    let promises: Promise<void>[] = this.fields.map(f => f.onSubmit(http, this.formControl.find(f.id)));
    return Promise.all(promises)
      .then(() => {
        this.isSubmitted = true;
      })
    ;
  }
}

export class WelcomeWizForm extends WizForm {
  constructor() {
    super({
      id: 'welcome',
      type: 'WelcomeWizForm',
      title: 'Overview'
    });
  }
}

export class BackupFilesWizForm extends WizForm {
  constructor() {
    super({
      id: 'backup-files',
      type: 'BackupFilesWizForm',
      title: 'Backup Files'
    });
  }
}

export class LaunchWizForm extends WizForm {
  constructor() {
    super({
      id: 'launch',
      type: 'LaunchWizForm',
      title: 'Launch'
    });
  }
}

export interface SelfSignedCertificateConfig {
  caCertificateSelector: {
    type: string,
    cert: string,
    key: string
  };
  endpoint: string;
  commonNameFrom: string;
  organizationNameFrom: string;
  dnsNameFrom: string;
  tlsCertInto: string;
  tlsKeyInto: string;
}

export interface CertificateWizFormConfig extends FormConfig {
  selfSignedCertificate: SelfSignedCertificateConfig;
}

export class CertificateWizForm extends WizForm {
  selfSignedCertificate: SelfSignedCertificateConfig;

  constructor(config: CertificateWizFormConfig) {
    super(config)

    this.selfSignedCertificate = config.selfSignedCertificate;
  }

  isValid(wizard: Wizard): boolean {
    let caType = wizard.wizardControl.find(this.selfSignedCertificate.caCertificateSelector.type).value;
    if (caType === CaCertificateType.SelfSigned) {
      return true;
    }

    return this.formControl.valid;
  }

  onSubmit(http: Http, wizard: Wizard): Promise<void> {
    let caType = wizard.wizardControl.find(this.selfSignedCertificate.caCertificateSelector.type).value;
    if (caType === CaCertificateType.Owned) {
      return super.onSubmit(http, wizard);
    }

    let payload = {
      caCert: wizard.wizardControl.find(this.selfSignedCertificate.caCertificateSelector.cert).value,
      caKey: wizard.wizardControl.find(this.selfSignedCertificate.caCertificateSelector.key).value,
      commonName: this.parseCommonNameFromUrl(wizard.wizardControl.find(this.selfSignedCertificate.commonNameFrom).value),
      organizationName: wizard.wizardControl.find(this.selfSignedCertificate.organizationNameFrom).value,
    };

    return http.post(this.selfSignedCertificate.endpoint, JSON.stringify(payload)).toPromise()
      .then(res => res.json())
      .then(res => {
        (<Control>this.formControl.find(this.selfSignedCertificate.tlsCertInto)).updateValue(res['tls-cert']);
        (<Control>this.formControl.find(this.selfSignedCertificate.tlsKeyInto)).updateValue(res['tls-key']);
      })
      .then(() => super.onSubmit(http, wizard))
    ;
  }

  private parseCommonNameFromUrl(url: string) {
    let a = document.createElement('a');
    a.href = url;
    return a.hostname;
  }
}

export class FormPayload {
  constructor(public id: string,
              public values: {}) {}
}

export function createForm(config: FormConfig) {
  switch (config.type) {
    case 'CertificateWizForm':
      return new CertificateWizForm(<CertificateWizFormConfig>config);
    default:
      return new WizForm(config);
  }
}

export function createField(config) {
  switch (config['type']) {
    case 'TextField':
      return new TextField(config);
    case 'TextAreaField':
      return new TextAreaField(config);
    case 'InfoField':
      return new InfoField(config);
    case 'HiddenField':
      return new HiddenField(config);
    case 'IdentityEmailField':
      return new IdentityEmailField(config);
    case 'PasswordField':
      return new PasswordField(config);
    case 'CertificateField':
      return new CertificateField(config);
    case 'SmartCertificateField':
      return new SmartCertificateField(config);
    case 'CaCertificateField':
      return new CaCertificateField(config);
    case 'RadioButtonGroupField':
      return new RadioButtonGroupField(config);
    case 'IdentityConnectorField':
      return new IdentityConnectorField(config);
    case 'PostgreSqlField':
      return new PostgreSqlField(config);
  }
}
