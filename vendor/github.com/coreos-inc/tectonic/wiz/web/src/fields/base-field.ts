import {
  AbstractControl,
} from '@angular/common';

import {
  Http,
} from '@angular/http';

import {
  ValidatorFn,
} from '../validators/validators';

export interface BaseFieldConfig {
  id?: string;
  type?: string,
  value?: any,
  bypass?: boolean,
  label?: string,
  placeholder?: string,
  validators?: string[],
  validationMessage?: string,
  description?: string,
  k8s?: K8sFieldConfig;
}

export interface K8sFieldConfig {
  namespace?: string;
  kind?: string;
  name?: string;
  type?: string;
  encoding?: string;
}

export class BaseField<T> {
  value: T;
  id: string;
  label: string;
  bypass: boolean;
  validators: string[] | ValidatorFn[];
  validationMessage: string;
  description: string;
  fieldType: string;
  componentType: string;
  path: string;
  fields: BaseField<any>[] = [];
  k8s: K8sFieldConfig;
  hidden: boolean = false;

  constructor(config: BaseFieldConfig) {
    this.fieldType = config.type;
    this.componentType = this.fieldType + 'Component';
    this.id = config.id;
    this.value = config.value;
    this.label = config.label || '';
    this.validators = config.validators;
    this.validationMessage = config.validationMessage;
    this.description = config.description;
    this.k8s = config.k8s;
    this.bypass = !!config.bypass;
  }

  onSubmit(http: Http, c: AbstractControl): Promise<void> {
    return Promise.resolve();
  }
}
