import {
  ControlGroup,
} from '@angular/common';

import {
  ValidatorFn,
  ValidatorResult,
  WizValidators,
} from '../validators/validators';

import {
  BaseField,
  BaseFieldConfig
} from './base-field';

export const POSTGRESQL_DEPLOY_TRUE: string = 'true';
export const POSTGRESQL_DEPLOY_FALSE: string = 'false';

export interface PostgreSqlFieldConfig extends BaseFieldConfig {
  deployField: {};
  urlField: {};
}

export class PostgreSqlField extends BaseField<{}> {
  path = 'app/fields/components/postgresql';
  deployField: BaseField<string>;
  urlField: BaseField<string>;

  constructor(config: PostgreSqlFieldConfig) {
    super(config);

    this.fields.push(this.deployField = new BaseField<string>(config.deployField));
    this.fields.push(this.urlField = new BaseField<string>(config.urlField));

    this.validators = [
      createPostgreSqlValidator(this)
    ];
  }
}

function createPostgreSqlValidator(f: PostgreSqlField): ValidatorFn {
  return function postgreSqlValidator(c: ControlGroup): ValidatorResult {
    if (c.find(f.deployField.id).value === POSTGRESQL_DEPLOY_TRUE) {
      return;
    }

    return WizValidators.psql(c.find(f.urlField.id));
  };
}
