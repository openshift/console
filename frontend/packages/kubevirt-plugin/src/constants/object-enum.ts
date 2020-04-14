import * as _ from 'lodash';

export abstract class ObjectEnum<T> {
  protected static getAllClassEnumProperties = <A>(Clazz: Function) =>
    Object.keys(Clazz)
      .filter((value) => Clazz[value] instanceof Clazz)
      .map((key) => Clazz[key]) as A[];

  static getAll = () => Object.freeze([]);

  protected readonly value: T;

  protected constructor(value: T) {
    this.value = value;
  }

  getValue = () => this.value;

  toString = () => _.toString(this.value);
}
