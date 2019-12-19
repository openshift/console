import * as _ from 'lodash';
import { Patch } from '@console/internal/module/k8s';
import { assureEndsWith } from '../utils';

export const patchSafeValue = (value: string): string =>
  value.replace('~', '~0').replace('/', '~1');

export enum PatchOperation {
  ADD = 'add',
  REMOVE = 'remove',
  REPLACE = 'replace',
}

export class PatchBuilder {
  private readonly path: string;

  private value: any;

  private valueIndex: number = -1;

  private valueKey: string = '';

  private operation: PatchOperation;

  private valid = true;

  constructor(path: string) {
    this.path = path;
  }

  setValue = (value) => {
    this.value = value;
    return this;
  };

  setOperation = (operation: PatchOperation) => {
    this.operation = operation;
    return this;
  };

  setListIndex = (index: number) => {
    this.valueIndex = index;
    return this;
  };

  setListRemove = <T>(value: T, items: T[], compareGetter?: (t: T) => any) =>
    this.setListRemoveSimpleValue(
      compareGetter ? compareGetter(value) : value,
      items,
      compareGetter,
    );

  setListRemoveSimpleValue = <T, U>(value: T | U, items: T[], compareGetter?: (t: T) => U) => {
    this.value = undefined;
    this.operation = PatchOperation.REMOVE;
    if (items) {
      const foundIndex = items.findIndex((t) =>
        compareGetter ? compareGetter(t) === (value as U) : t === (value as T),
      );
      if (foundIndex < 0) {
        this.valid = false; // do not do anything
      } else {
        this.valueIndex = items.length === 1 ? -1 : foundIndex; // delete the whole list if last value there
      }
    } else {
      this.valueIndex = -1; // remove the empty list
    }
    return this;
  };

  setListUpdate = <T, U>(
    value: T,
    items?: T[],
    compareGetter?: (t: T) => U,
    oldSimpleValue?: T | U,
  ) => {
    if (items) {
      this.value = value;
      const foundIndex = items.findIndex((t) =>
        compareGetter
          ? compareGetter(t) === ((oldSimpleValue as U) || compareGetter(value))
          : t === (oldSimpleValue || value),
      );
      if (foundIndex < 0) {
        this.valueIndex = items.length;
        this.operation = PatchOperation.ADD;
      } else {
        this.valueIndex = foundIndex;
        this.operation = PatchOperation.REPLACE;
      }
    } else {
      // list is missing - add the whole list
      this.value = [value];
      this.valueIndex = -1;
      this.operation = PatchOperation.ADD;
    }
    return this;
  };

  setObjectRemove = (key: string, object: { [k: string]: any }) => {
    if (_.has(object, [key])) {
      this.value = undefined;
      this.valueKey = key;
      this.operation = PatchOperation.REMOVE;
    } else {
      this.valid = false;
    }
    return this;
  };

  setObjectUpdate = (key: string, value: any, object: { [k: string]: any }) => {
    if (object == null) {
      this.value = { [key]: value };
    } else {
      this.value = value;
      this.valueKey = key;
    }
    this.operation = _.has(object, [key]) ? PatchOperation.REPLACE : PatchOperation.ADD;
    return this;
  };

  isPatchValid = () => this.valid && !!(this.path && this.operation);

  build = (): Patch => {
    if (!this.isPatchValid()) {
      return null;
    }

    let resultPath;

    if (this.valueIndex < 0) {
      resultPath = this.valueKey
        ? assureEndsWith(this.path, `/${patchSafeValue(this.valueKey)}`)
        : this.path;
    } else {
      resultPath = `${assureEndsWith(this.path, '/')}${this.valueIndex}`;
    }

    const result: Patch = {
      op: this.operation,
      path: resultPath,
    };

    if (this.operation !== PatchOperation.REMOVE) {
      result.value = this.value;
    }

    return result;
  };
}
