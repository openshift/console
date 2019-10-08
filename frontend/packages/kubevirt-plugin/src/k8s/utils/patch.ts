import { Patch } from '@console/internal/module/k8s';
import { assureEndsWith } from '../../utils/grammar';

export const patchSafeValue = (value: string): string => value.replace('/', '~1');

export enum PatchOperation {
  ADD = 'add',
  REMOVE = 'remove',
  REPLACE = 'replace',
}

export class PatchBuilder {
  private readonly path: string;

  private value: any;

  private valueIndex: number = -1;

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

  setListRemove = <T>(value: T, items: T[], compareGetter?: (t: T) => any) => {
    this.value = undefined;
    this.operation = PatchOperation.REMOVE;
    if (items) {
      const foundIndex = items.findIndex((t) =>
        compareGetter ? compareGetter(t) === compareGetter(value) : t === value,
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

  setListUpdate = <T>(value: T, items?: T[], compareGetter?: (t: T) => any) => {
    if (items) {
      this.value = value;
      const foundIndex = items.findIndex((t) =>
        compareGetter ? compareGetter(t) === compareGetter(value) : t === value,
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

  isPatchValid = () => this.valid && !!(this.path && this.operation);

  build = (): Patch => {
    if (!this.isPatchValid()) {
      return null;
    }

    const result: any = {
      op: this.operation,
      path: this.valueIndex < 0 ? this.path : `${assureEndsWith(this.path, '/')}${this.valueIndex}`,
    };

    if (this.operation !== PatchOperation.REMOVE) {
      result.value = this.value;
    }

    return result;
  };
}
