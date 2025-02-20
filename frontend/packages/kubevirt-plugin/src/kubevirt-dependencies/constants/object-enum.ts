import * as _ from 'lodash';

export abstract class ObjectEnum<T> {
  protected static getAllClassEnumProperties = <A extends ObjectEnum<any>>(Clazz: Function) => {
    const usedValues = new Set();
    return Object.keys(Clazz)
      .filter((value) => Clazz[value] instanceof Clazz)
      .map((key) => {
        const result = Clazz[key];
        if (usedValues.has(result.getValue())) {
          throw new Error(`${result}: value must be unique`);
        }
        usedValues.add(result.getValue());
        return result;
      }) as A[];
  };

  static getAll = () => Object.freeze([]);

  protected readonly value: T;

  protected constructor(value: T) {
    if (!value) {
      throw new Error("ObjectEnum: value can't be empty");
    }
    this.value = value;
  }

  getValue = () => this.value;

  toString() {
    return _.toString(this.value);
  }
}

export const cloneDeepWithEnum = (object) => {
  return _.cloneDeepWith(object, (value) => {
    if (value instanceof ObjectEnum) {
      return value;
    }
    return undefined;
  });
};
