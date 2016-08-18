import { Control, ControlGroup } from '@angular/common';
import { BaseField } from './base-field';
import { HiddenField } from './hidden-field';
import { ValidatorFn, ValidatorResult, WizValidators } from '../validators/validators';

export class UserDirectory {
  constructor(
    public label: string,
    public value: string,
    public isDefault?: boolean
  ) { }
}

export const USER_DIRECTORY_LDAP = new UserDirectory('LDAP', 'ldap', true);
export const USER_DIRECTORY_LOCAL = new UserDirectory('PostgreSQL Database', 'local');
export const USER_DIRECTORIES = [USER_DIRECTORY_LDAP, USER_DIRECTORY_LOCAL];

export class LdapSecurity {
  constructor(
    public label: string,
    public value: string,
    public isDefault?: boolean
  ) { }
}

export const LDAP_SECURITY_TLS = new LdapSecurity('Use TLS', 'tls', true);
export const LDAP_SECURITY_SSL = new LdapSecurity('Use SSL', 'ssl');
export const LDAP_SECURITY_UNENCRYPTED = new LdapSecurity('Unencrypted', 'unencrypted');
export const LDAP_SECURITIES = [LDAP_SECURITY_TLS, LDAP_SECURITY_SSL, LDAP_SECURITY_UNENCRYPTED];

export class IdentityConnectorField extends BaseField<{}> {
  path = 'app/fields/components/identity-connector';

  connectorsField: HiddenField;
  emailFromField: HiddenField;
  emailerConfigField: HiddenField;
  adminUser: HiddenField;
  adminPassword: HiddenField;

  constructor(config: any) {
    super(config);

    let connectorsFieldConfig = config['connectorsField'] || {};
    this.fields.push(this.connectorsField = new HiddenField({
      id: connectorsFieldConfig.id || 'identity-connectors',
      value: connectorsFieldConfig.value,
      validators: ['NONEMPTY'],
      k8s: connectorsFieldConfig.k8s || {
        namespace: 'tectonic-system',
        kind: 'Secret',
        name: 'tectonic-identity-config-secret'
      }
    }));

    let emailFromFieldConfig = config['emailFromField'] || {};
    this.fields.push(this.emailFromField = new HiddenField({
      id: emailFromFieldConfig.id || 'identity-email-from',
      value: emailFromFieldConfig.value,
      k8s: emailFromFieldConfig.k8s || {
        namespace: 'tectonic-system',
        kind: 'ConfigMap',
        name: 'tectonic-config'
      }
    }));

    let emailerConfigFieldConfig = config['emailerConfigField'] || {};
    this.fields.push(this.emailerConfigField = new HiddenField({
      id: emailerConfigFieldConfig.id || 'identity-emailer-config',
      value: emailerConfigFieldConfig.value,
      k8s: emailerConfigFieldConfig.k8s || {
        namespace: 'tectonic-system',
        kind: 'Secret',
        name: 'tectonic-identity-config-secret'
      }
    }));

    let adminUserFieldConfig = config['adminUserField'] || {};
    this.fields.push(this.adminUser = new HiddenField({
      id: adminUserFieldConfig.id || 'identity-admin-user',
      value: adminUserFieldConfig.value,
      k8s: adminUserFieldConfig.k8s || {
        namespace: 'tectonic-system',
        kind: 'ConfigMap',
        name: 'tectonic-config'
      }
    }));

    let adminPasswordFieldConfig = config['adminPasswordField'] || {};
    this.fields.push(this.adminPassword = new HiddenField({
      id: adminPasswordFieldConfig.id || 'identity-admin-password',
      value: adminPasswordFieldConfig.value,
      k8s: adminPasswordFieldConfig.k8s || {
        namespace: 'tectonic-system',
        kind: 'Secret',
        name: 'tectonic-identity-config-secret'
      }
    }));

    this.validators = [
      createIdentityConnectorValidator(this)
    ];
  }
}

function createIdentityConnectorValidator(f: IdentityConnectorField): ValidatorFn {
  return function identityConnectorValidator(c: ControlGroup): ValidatorResult {
    let connectorsControl: Control = (c.controls[f.connectorsField.id] as Control);
    if (!connectorsControl.valid) {
      return createError('Connectors field is invalid.');
    }

    let connectors: { [key: string]: string } = JSON.parse(connectorsControl.value)[0];
    if (connectors['type'] === USER_DIRECTORY_LDAP.value) {
      return identityConnectorLdapValidator(c);
    }

    return identityConnectorLocalValidator(c);
  };

  function identityConnectorLdapValidator(c: ControlGroup): ValidatorResult {
    return null;
  }

  function identityConnectorLocalValidator(c: ControlGroup): ValidatorResult {
    if (WizValidators.nonempty(c.controls[f.emailFromField.id])) {
      return createError('Email From field is invalid.');
    }

    if (WizValidators.nonempty(c.controls[f.emailerConfigField.id])) {
      return createError('Emailer Config field is invalid.');
    }

    if (WizValidators.nonempty(c.controls[f.adminUser.id])) {
      return createError('Admin User field is invalid.');
    }

    if (WizValidators.nonempty(c.controls[f.adminPassword.id])) {
      return createError('Admin Password field is invalid.');
    }

    return null;
  }

  function createError(message: string): ValidatorResult {
    return { identityConnector: message };
  }
}
