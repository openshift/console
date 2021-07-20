import * as _ from 'lodash';
import { assureEndsWith } from '../../utils';

export type Patch = {
  op: string;
  path: string;
  value?: any;
};

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

  add = (value) => {
    this.value = value;
    return this.setOperation(PatchOperation.ADD);
  };

  replace = (value) => {
    this.value = value;
    return this.setOperation(PatchOperation.REPLACE);
  };

  remove = () => this.setOperation(PatchOperation.REMOVE);

  setListRemove = <T>(items: T[], removedItemEquals: (item: T) => boolean) => {
    this.value = undefined;
    this.operation = PatchOperation.REMOVE;
    if (items) {
      const foundIndex = items.findIndex(removedItemEquals);
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

  setListUpdate = <T>(
    item: T,
    items?: T[],
    updatedItemEquals: (other: T, updatedItem: T) => boolean = (other, updatedValue) =>
      other === updatedValue,
  ) => {
    if (items) {
      const foundIndex = items.findIndex((other) => updatedItemEquals(other, item));
      if (foundIndex < 0) {
        this.value = item;
        this.valueIndex = items.length;
        this.operation = PatchOperation.ADD;
      } else if (_.isEqual(items[foundIndex], item)) {
        this.valid = false; // no change
      } else {
        this.value = item;
        this.valueIndex = foundIndex;
        this.operation = PatchOperation.REPLACE;
      }
    } else {
      // list is missing - add the whole list
      this.value = [item];
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
    } else if (object[key] === value) {
      this.valid = false;
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

  buildAddObjectKeysPatches = (
    newObject: { [k: string]: any },
    oldObject: { [k: string]: any },
  ): Patch[] => {
    if (!newObject) {
      return [];
    }
    let builders;
    if (!oldObject) {
      builders = [new PatchBuilder(this.path).add(newObject)];
    } else {
      builders = Object.keys(newObject).map((key) =>
        new PatchBuilder(this.path).setObjectUpdate(key, newObject[key], oldObject),
      );
    }

    return _.compact(builders.map((u) => u.build()));
  };
}
