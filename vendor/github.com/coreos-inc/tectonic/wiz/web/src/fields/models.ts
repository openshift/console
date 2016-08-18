import {
  BaseField,
  BaseFieldConfig,
} from './base-field';

import {
  TextAreaField,
} from './textarea-field';

import {
  SelfSignedCertificateConfig,
} from './ca-certificate-field'

export * from './base-field';
export * from './hidden-field';
export * from './textarea-field';
export * from './identity-connector-field';
export * from './postgresql-field';
export * from './ca-certificate-field';

export class TextField extends BaseField<string> {
  path = 'app/fields/components/text';
  placeholder: string;
  constructor(options: {}) {
    super(options);
    this.placeholder = options['placeholder'] || '';
  }
}

export class InfoField extends BaseField<string> {
  path = 'app/fields/components/info';
  constructor(options: {}) {
    super(options);
    this.bypass = true;
  }
}

export class IdentityEmailField extends BaseField<{}> {
  path = 'app/fields/components/identity-email';
  constructor(options: {}) {
    super(options);
  }
}

export class PasswordField extends BaseField<string> {
  path = 'app/fields/components/password';
  constructor(options: {}) {
    super(options);
  }
}

export class CertificateField extends BaseField<{}> {
  path = 'app/fields/components/certificate';
  certField: TextAreaField;
  keyField: TextAreaField;

  constructor(options: {}) {
    super(options);

    this.fields.push(this.certField = new TextAreaField({
      type: 'TextAreaField',
      id: options['certID'] || 'tls-cert',
      label: options['certLabel'] || 'Certificate',
      value: options['certValue'] || '',
      description: 'It is safe to provide wildcard certs more than once using this installer',
      placeholder: `Paste your certificate here. It should start with:\n\n-----BEGIN CERTIFICATE-----\n\nIt should end with:\n\n-----END CERTIFICATE-----`,
      validators: ['CERTIFICATE'],
      k8s: {
        kind: options['k8s']['kind'] || 'Secret',
        namespace: options['k8s']['namespace'] || '',
        name: options['certName'] || options['k8s']['name'] || '',
      },
    }));

    this.fields.push(this.keyField = new TextAreaField({
      type: 'TextAreaField',
      id: options['privateKeyID'] || 'tls-key',
      label: options['privateKeyLabel'] || 'Private Key',
      value: options['privateKeyValue'] || '',
      description: 'It is safe to provide wildcard certs more than once using this installer',
      placeholder: `Paste your private key here. It should start with:\n\n-----BEGIN RSA PRIVATE KEY-----\n\nIt should end with:\n\n-----END RSA PRIVATE KEY-----`,
      validators: ['PRIVATE_KEY'],
      k8s: {
        kind: options['k8s']['kind'] || 'Secret',
        namespace: options['k8s']['namespace'] || '',
        name: options['privateKeyName'] || options['k8s']['name'] || '',
      },
    }));
  }
}

export interface SmartCertificateFieldConfig extends BaseFieldConfig {
  selfSignedCertificate: SelfSignedCertificateConfig
}

export class SmartCertificateField extends CertificateField {
  path = 'app/fields/components/smart-certificate';
  selfSignedCertificate: SelfSignedCertificateConfig;

  constructor(config: SmartCertificateFieldConfig) {
    super(config);

    this.selfSignedCertificate = config.selfSignedCertificate;
  }
}

export interface RadioButtonGroupFieldItem {
  label: string;
  value: any;
  description?: string;
}

export class RadioButtonGroupField extends BaseField<{}> {
  path = 'app/fields/components/radio-button-group';
  items: RadioButtonGroupFieldItem[] = [];

  constructor(config: any) {
    super(config);

    this.items = config.items;
  }
}
