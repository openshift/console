import {
  Component,
  Input,
  OnInit,
} from '@angular/core';

import {
  Control,
  ControlGroup,
  Validators
} from '@angular/common';

import {
  PostgreSqlField,
  POSTGRESQL_DEPLOY_TRUE,
  POSTGRESQL_DEPLOY_FALSE,
} from '../models';

import {
  POSTGRESQL_URL_RE,
  WizValidators
} from '../../validators/validators';

import {
  WizValidationErrorComponent
} from '../../validators/validation-error';

import {
  FocusDirective
} from '../../focus/focus.directive'

@Component({
  selector: 'wiz-postgresql-field',
  templateUrl: 'app/static/src/fields/components/postgresql.html',
  directives: [
    WizValidationErrorComponent,
    FocusDirective,
  ],
})
export class PostgreSqlFieldComponent implements OnInit {
  @Input() fieldModel: PostgreSqlField;
  @Input() control: Control;
  wrappingControl: ControlGroup = new ControlGroup({
    deploy: new Control(null, Validators.compose([Validators.required])),
    connection: new ControlGroup({
      address: new Control(null, Validators.compose([Validators.required, WizValidators.address])),
      username: new Control(null, Validators.required),
      password: new Control(null, Validators.required),
      database: new Control(null, Validators.required),
      extra: new Control(),
    })
  });
  POSTGRESQL_DEPLOY_TRUE = POSTGRESQL_DEPLOY_TRUE;
  POSTGRESQL_DEPLOY_FALSE = POSTGRESQL_DEPLOY_FALSE;

  ngOnInit(): void {
    this.wrappingControl.valueChanges.subscribe(() => this.toControl());
    this.fromControl();
  }

  fromControl(): void {
    let deploy: string = this.control.find(this.fieldModel.deployField.id).value;
    (this.wrappingControl.find('deploy') as Control).updateValue(deploy);

    if (deploy === POSTGRESQL_DEPLOY_TRUE) {
      return;
    }

    // break postgresql url into username, password, address (host, port), database and extra parts
    let parts = POSTGRESQL_URL_RE.exec(this.control.find(this.fieldModel.urlField.id).value);
    if (!parts) {
      return;
    }

    let [, username, password, address, database, extra] = parts;
    (this.wrappingControl.find('connection/address') as Control).updateValue(address);
    (this.wrappingControl.find('connection/username') as Control).updateValue(username);
    (this.wrappingControl.find('connection/password') as Control).updateValue(password);
    (this.wrappingControl.find('connection/database') as Control).updateValue(database);
    (this.wrappingControl.find('connection/extra') as Control).updateValue(extra);
  }

  toControl(): void {
    let deploy: string = this.wrappingControl.find('deploy').value;
    (this.control.find(this.fieldModel.deployField.id) as Control).updateValue(deploy);

    if (deploy === POSTGRESQL_DEPLOY_TRUE) {
      (this.control.find(this.fieldModel.urlField.id) as Control).updateValue(null);
      return;
    }

    if (!this.wrappingControl.find('connection').valid) {
      return;
    }

    let value = this.wrappingControl.find('connection').value;
    (this.control.find(this.fieldModel.urlField.id) as Control)
      .updateValue(`postgres://${value['username']}:${value['password']}@${value['address']}/${value['database']}${value['extra'] || '?sslmode=disable'}`);
  }
}
