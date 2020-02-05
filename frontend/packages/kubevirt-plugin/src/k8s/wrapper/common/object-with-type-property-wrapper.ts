import * as _ from 'lodash';
import { ObjectEnum } from '../../../constants';
import { Wrapper } from './wrapper';

export abstract class ObjectWithTypePropertyWrapper<
  RESOURCE,
  TYPE extends ObjectEnum<string>
> extends Wrapper<RESOURCE> {
  private readonly TypeClass: { getAll: () => TYPE[] | Readonly<TYPE[]> };

  private readonly typeDataPath: string[];

  protected static defaultMergeWrappersWithType = <
    A,
    B extends ObjectWithTypePropertyWrapper<A, any>
  >(
    Clazz,
    wrappers: B[],
  ): B => {
    const result = Wrapper.defaultMergeWrappers(Clazz, wrappers);
    const lastWithType = _.last(wrappers.filter((wrapper) => wrapper && wrapper.getType()));

    if (lastWithType) {
      result.setType(lastWithType.getType(), result.getTypeData(lastWithType.getType()));
    }
    return result;
  };

  protected constructor(
    data: RESOURCE,
    copy = false,
    opts: { initializeWithType?: TYPE; initializeWithTypeData?: any },
    typeClass: { getAll: () => TYPE[] | Readonly<TYPE[]> },
    typeDataPath: string[] = [],
  ) {
    super(data, copy);
    this.TypeClass = typeClass;
    this.typeDataPath = typeDataPath;

    if (opts && opts.initializeWithType) {
      const { initializeWithTypeData, initializeWithType } = opts;

      const resultTypeData = initializeWithTypeData
        ? copy
          ? _.cloneDeep(initializeWithTypeData)
          : initializeWithTypeData
        : this.getTypeData(initializeWithType);
      this.setType(initializeWithType, resultTypeData);
    }
  }

  getType = (): TYPE =>
    this.TypeClass.getAll().find((type) => this.getIn([...this.typeDataPath, type.getValue()]));

  getTypeValue = (): string => {
    const type = this.getType();
    return type && type.getValue();
  };

  hasType = (): boolean => !!this.getType();

  protected getTypeData = (type?: TYPE) =>
    this.getIn([...this.typeDataPath, (type || this.getType()).getValue()]);

  protected setType = (type?: TYPE, typeData?: any) => {
    const typeDataParent =
      this.typeDataPath.length === 0 ? this.data : this.getIn(this.typeDataPath);
    if (!typeDataParent) {
      return;
    }
    this.TypeClass.getAll().forEach(
      (superflousProperty) => delete typeDataParent[superflousProperty.getValue()],
    );
    if (type) {
      typeDataParent[type.getValue()] = typeData ? _.cloneDeep(typeData) : {};
    }
  };

  protected addTypeData = (newTypeData?: any) => {
    const type = this.getType();
    this.setType(type, { ...this.getTypeData(type), ...newTypeData });
  };
}
