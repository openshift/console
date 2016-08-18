import {
  Control,
  ControlGroup,
  Validators,
} from '@angular/common';

import {
  Http,
} from '@angular/http';

import {
  BaseField,
  BaseFieldConfig,
} from './base-field';

import {
  HiddenField,
} from './hidden-field';

import {
  ValidatorFn,
  ValidatorResult,
  WizValidators,
} from '../validators/validators';

export interface SelfSignedCertificateConfig {
  caCertificateSelector: {
    type: string,
    cert: string,
    key: string
  },
  endpoint: string;
  commonNameFrom: string;
  organizationNameFrom: string;
}

export interface CaCertificateFieldConfig extends BaseFieldConfig {
  selfSignedCertificate: SelfSignedCertificateConfig,
  typeField: {
    id: string,
    value: string,
  },
  organizationNameField: {
    id: string,
    value: string,
  },
  commonNameField: {
    id: string,
    value: string,
  },
  certField: {
    id: string,
    value: string,
  },
  keyField: {
    id: string,
    value: string,
  },
}

export class CaCertificateType {
  static SelfSigned: string = 'self-signed';
  static Owned: string = 'owned';
};

export class CaCertificateField extends BaseField<{}> {
  path = 'app/fields/components/ca-certificate';
  selfSignedCertificate: SelfSignedCertificateConfig
  typeField: HiddenField;
  organizationNameField: HiddenField;
  commonNameField: HiddenField;
  certField: HiddenField;
  keyField: HiddenField;

  constructor(config: CaCertificateFieldConfig) {
    super(config);

    this.selfSignedCertificate = config.selfSignedCertificate;

    this.fields.push(this.typeField = new HiddenField({
      id: config.typeField.id || 'type',
      value: CaCertificateType.SelfSigned,
      k8s: config.k8s,
    }));

    this.fields.push(this.organizationNameField = new HiddenField({
      id: config.organizationNameField.id || 'organization-name',
      value: config.organizationNameField.value,
      k8s: config.k8s,
    }));

    this.fields.push(this.commonNameField = new HiddenField({
      id: config.commonNameField.id || 'common-name',
      value: config.commonNameField.value,
      k8s: config.k8s,
    }));

    this.fields.push(this.certField = new HiddenField({
      id: config.certField.id || 'cert',
      value: config.certField.value,
      k8s: config.k8s,
    }));

    this.fields.push(this.keyField = new HiddenField({
      id: config.keyField.id || 'key',
      value: config.keyField.value,
      k8s: config.k8s,
    }));

    this.validators = [
      createCaCertificateValidator(this)
    ];
  }

  onSubmit(http: Http, c: ControlGroup): Promise<void> {
    let type: string = c.find(this.typeField.id).value;
    if (type === CaCertificateType.Owned) {
      return Promise.resolve();
    }

    let payload: {} = {
      organizationName: c.find(this.organizationNameField.id).value,
      commonName: c.find(this.commonNameField.id).value,
    };

    return http.post(this.selfSignedCertificate.endpoint, JSON.stringify(payload)).toPromise()
      .then(res => res.json())
      .then(res => {
        (c.find(this.certField.id) as Control).updateValue(res['tls-cert']);
        (c.find(this.keyField.id) as Control).updateValue(res['tls-key']);
      });
  }
}

function createCaCertificateValidator(f: CaCertificateField): ValidatorFn {
  return function caCertificateValidator(c: ControlGroup): ValidatorResult {
    let type: string = c.find(f.typeField.id).value;

    if (type === CaCertificateType.SelfSigned) {
      return caCertificateSelfSignedValidator(c);
    }

    return caCertificateOwnedValidator(c);
  };

  function caCertificateSelfSignedValidator(c: ControlGroup): ValidatorResult {
    return Validators.required(c.find(f.organizationNameField.id))
      || Validators.required(c.find(f.commonNameField.id));
  }

  function caCertificateOwnedValidator(c: ControlGroup): ValidatorResult {
    return Validators.compose([Validators.required, WizValidators.certificate])(c.find(f.certField.id));
  }
}
