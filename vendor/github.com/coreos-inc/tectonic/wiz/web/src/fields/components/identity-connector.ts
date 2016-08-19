import {
  Component,
  Input,
  OnInit,
} from '@angular/core';

import {
  Control,
  ControlGroup,
  Validators,
} from '@angular/common';

import {
  IdentityConnectorField,
  LDAP_SECURITIES,
  LDAP_SECURITY_SSL,
  LDAP_SECURITY_TLS,
  LDAP_SECURITY_UNENCRYPTED,
  USER_DIRECTORIES,
  USER_DIRECTORY_LDAP,
  USER_DIRECTORY_LOCAL,
} from '../identity-connector-field';

import {
  WizValidators
} from '../../validators/validators';

import {
  WizValidationErrorComponent
} from '../../validators/validation-error';

import {
  FocusDirective
} from '../../focus/focus.directive'

@Component({
  selector: 'wiz-identity-connector-field',
  templateUrl: 'app/static/src/fields/components/identity-connector.html',
  styleUrls: ['app/static/src/fields/components/identity-connector.css'],
  directives: [
    FocusDirective,
    WizValidationErrorComponent,
  ],
})
export class IdentityConnectorFieldComponent implements OnInit {
  @Input() fieldModel: IdentityConnectorField;
  @Input() control: ControlGroup;

  LDAP_SECURITIES = LDAP_SECURITIES;
  LDAP_SECURITY_UNENCRYPTED = LDAP_SECURITY_UNENCRYPTED;
  USER_DIRECTORIES = USER_DIRECTORIES;
  USER_DIRECTORY_LDAP = USER_DIRECTORY_LDAP;
  USER_DIRECTORY_LOCAL = USER_DIRECTORY_LOCAL;

  wrappingControl: ControlGroup = new ControlGroup({
    userDirectory: new Control(null, Validators.required),
    ldap: new ControlGroup({
      connection: new ControlGroup({
        address: new Control(null, Validators.compose([Validators.required, WizValidators.address])),
        security: new Control(null, Validators.required),
        caFile: new Control(),
        username: new Control(null, Validators.required),
        password: new Control(null, Validators.required),
      }),
      dataStructure: new ControlGroup({
        baseDn: new Control(null, Validators.required),
        searchFilter: new Control(null, Validators.required),
        usernameAttribute: new Control(null, Validators.required),
        emailAttribute: new Control(null, Validators.required),
      }),
    }),
    local: new ControlGroup({
      adminAccount: new ControlGroup({
        emailAddress: new Control(null, Validators.compose([Validators.required, WizValidators.email])),
        password: new Control(null, Validators.required),
      }),
      smtpSettings: new ControlGroup({
        fromAddress: new Control(null, Validators.compose([Validators.required, WizValidators.email])),
        smtpAddress: new Control(null, Validators.compose([Validators.required, WizValidators.address])),
        username: new Control(null, Validators.required),
        password: new Control(null, Validators.required),
      }),
    }),
  });

  ngOnInit(): void {
    this.wrappingControl.valueChanges.subscribe(() => this.toControl());
    this.fromControl();
  }

  onCaFileChange(file: File) {
    let fileReader = new FileReader();
    fileReader.readAsText(file);
    fileReader.addEventListener('load', () => (this.wrappingControl.find('ldap/connection/caFile') as Control).updateValue(fileReader.result));
  }

  fromControl(): void {
    let connectorAsJson: string = this.control.find(this.fieldModel.connectorsField.id).value;
    let connector: {[key: string]: string} = JSON.parse(connectorAsJson || '[{}]')[0];

    let connectorType: string = connector['type'] || getDefaultValueFrom(USER_DIRECTORIES);
    return connectorType === USER_DIRECTORY_LDAP.value
      ? this.fromControlAsLdap(connector)
      : this.fromControlAsLocal(connector)
    ;
  }

  fromControlAsLdap(connector: {[key: string]: string}): void {
    (this.wrappingControl.find('userDirectory') as Control)
      .updateValue(USER_DIRECTORY_LDAP.value);

    (this.wrappingControl.find('ldap/connection/address') as Control)
      .updateValue(connector['host']);

    (this.wrappingControl.find('ldap/connection/security') as Control)
      .updateValue(connector['useTLS']
        ? LDAP_SECURITY_TLS.value
        : connector['useSSL']
          ? LDAP_SECURITY_SSL.value
          : LDAP_SECURITY_UNENCRYPTED.value
      );

    (this.wrappingControl.find('ldap/connection/caFile') as Control)
      .updateValue(connector['caFile']);
    (this.wrappingControl.find('ldap/dataStructure/baseDn') as Control)
      .updateValue(connector['baseDN']);
    (this.wrappingControl.find('ldap/dataStructure/searchFilter') as Control)
      .updateValue(connector['searchFilter']);
    (this.wrappingControl.find('ldap/dataStructure/usernameAttribute') as Control)
      .updateValue(connector['nameAttribute']);
    (this.wrappingControl.find('ldap/dataStructure/emailAttribute') as Control)
      .updateValue(connector['emailAttribute']);
    (this.wrappingControl.find('ldap/connection/username') as Control)
      .updateValue(connector['searchBindDN']);
    (this.wrappingControl.find('ldap/connection/password') as Control)
      .updateValue(connector['searchBindPw']);
  }

  fromControlAsLocal(connector: {[key: string]: string}): void {
    // user directory
    (() => {
      (this.wrappingControl.find('userDirectory') as Control)
        .updateValue(USER_DIRECTORY_LOCAL.value);
    })();

    // email from
    (() => {
      (this.wrappingControl.find('local/smtpSettings/fromAddress') as Control).updateValue(
        this.control.find(this.fieldModel.emailFromField.id).value);
    })();

    // emailer config
    (() => {
      let emailerConfig: { [key: string]: string } = JSON.parse(this.control.find(this.fieldModel.emailerConfigField.id).value || '{}');

      if (emailerConfig['host'] && emailerConfig['port']) {
        (this.wrappingControl.find('local/smtpSettings/smtpAddress') as Control)
          .updateValue(`${emailerConfig['host']}:${emailerConfig['port']}`);
      }

      (this.wrappingControl.find('local/smtpSettings/username') as Control)
        .updateValue(emailerConfig['username']);
      (this.wrappingControl.find('local/smtpSettings/password') as Control)
        .updateValue(emailerConfig['password']);
    })();

    // admin account email address
    (() => {
      (this.wrappingControl.find('local/adminAccount/emailAddress') as Control)
        .updateValue(this.control.find(this.fieldModel.adminUser.id).value);
    })();

    (() => {
      // admin account password
      (this.wrappingControl.find('local/adminAccount/password') as Control)
        .updateValue(this.control.find(this.fieldModel.adminPassword.id).value);
    })();
  }

  toControl(): void {
    if (!isIdentityConnectorValid(this.wrappingControl)) {
      (this.control.find(this.fieldModel.connectorsField.id) as Control).updateValue(null);
      (this.control.find(this.fieldModel.emailFromField.id) as Control).updateValue(null);
      (this.control.find(this.fieldModel.emailerConfigField.id) as Control).updateValue(null);
      (this.control.find(this.fieldModel.adminUser.id) as Control).updateValue(null);
      (this.control.find(this.fieldModel.adminPassword.id) as Control).updateValue(null);
      return;
    }

    let userDirectory: string = this.wrappingControl.find('userDirectory').value;
    return userDirectory === USER_DIRECTORY_LDAP.value
      ? this.toControlAsLdap()
      : this.toControlAsLocal()
    ;
  }

  toControlAsLdap(): void {
    (this.control.find(this.fieldModel.connectorsField.id) as Control)
      .updateValue(JSON.stringify([{
        id: USER_DIRECTORY_LDAP.value,
        type: USER_DIRECTORY_LDAP.value,
        host: this.wrappingControl.find('ldap/connection/address').value,
        useTLS: this.wrappingControl.find('ldap/connection/security').value === LDAP_SECURITY_TLS.value,
        useSSL: this.wrappingControl.find('ldap/connection/security').value === LDAP_SECURITY_SSL.value,
        caFile: this.wrappingControl.find('ldap/connection/caFile').value,
        baseDN: this.wrappingControl.find('ldap/dataStructure/baseDn').value,
        searchFilter: this.wrappingControl.find('ldap/dataStructure/searchFilter').value,
        nameAttribute: this.wrappingControl.find('ldap/dataStructure/usernameAttribute').value,
        emailAttribute: this.wrappingControl.find('ldap/dataStructure/emailAttribute').value,
        searchBeforeAuth: true,
        searchBindDN: this.wrappingControl.find('ldap/connection/username').value,
        searchBindPw: this.wrappingControl.find('ldap/connection/password').value,
      }]));
  }

  toControlAsLocal(): void {
    (this.control.find(this.fieldModel.connectorsField.id) as Control)
      .updateValue(JSON.stringify([{
        id: USER_DIRECTORY_LOCAL.value,
        type: USER_DIRECTORY_LOCAL.value
      }]));

    (this.control.find(this.fieldModel.emailFromField.id) as Control)
      .updateValue(this.wrappingControl.find('local/smtpSettings/fromAddress').value);

    let hostParts = this.wrappingControl.find('local/smtpSettings/smtpAddress').value.split(':');
    let host = hostParts[0];
    let port = 25;
    if (hostParts[1]) {
      port = parseInt(hostParts[1], 10);
    }
    (this.control.find(this.fieldModel.emailerConfigField.id) as Control).
      updateValue(JSON.stringify({
        type: 'smtp',
        auth: 'plain',
        host: host,
        port: port,
        username: this.wrappingControl.find('local/smtpSettings/username').value,
        password: this.wrappingControl.find('local/smtpSettings/password').value,
      }));

    (this.control.find(this.fieldModel.adminUser.id) as Control).
      updateValue(this.wrappingControl.find('local/adminAccount/emailAddress').value);

    (this.control.find(this.fieldModel.adminPassword.id) as Control).
      updateValue(this.wrappingControl.find('local/adminAccount/password').value);
  }
}

function isIdentityConnectorValid(c: ControlGroup): boolean {
  let userDirectory: string = c.find('userDirectory').value;
  return userDirectory === USER_DIRECTORY_LDAP.value
    ? isIdentityConnectorLdapValid(c.find('ldap') as ControlGroup)
    : isIdentityConnectorLocalValid(c.find('local') as ControlGroup)
  ;
}

function isIdentityConnectorLdapValid(c: ControlGroup): boolean {
  let isEncrypted: boolean = c.find('connection/security').value !== LDAP_SECURITY_UNENCRYPTED.value;
  if (isEncrypted && Validators.compose([Validators.required, WizValidators.certificate])(c.find('connection/caFile'))) {
    return false;
  }

  return c.valid;
}

function isIdentityConnectorLocalValid(c: ControlGroup): boolean {
  return c.valid;
}

function getDefaultValueFrom(items: {isDefault: boolean, value: string}[]) {
  let defaultItem = items.filter(item => item.isDefault)[0];
  return defaultItem ? defaultItem.value : null;
}
