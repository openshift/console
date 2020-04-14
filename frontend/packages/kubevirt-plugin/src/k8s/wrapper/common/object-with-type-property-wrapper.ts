import * as _ from 'lodash';
import { ObjectEnum } from '../../../constants';
import { omitEmpty } from '../../../utils/common';
import { Wrapper } from './wrapper';

export abstract class ObjectWithTypePropertyWrapper<
  RESOURCE,
  TYPE extends ObjectEnum<string>,
  COMBINED_TYPE_DATA,
  SELF extends ObjectWithTypePropertyWrapper<RESOURCE, TYPE, COMBINED_TYPE_DATA, SELF>
> extends Wrapper<RESOURCE, SELF> {
  private readonly TypeClass: { getAll: () => TYPE[] | Readonly<TYPE[]> };

  private readonly typeDataPath: string[];

  protected constructor(
    data: RESOURCE | SELF,
    copy = false,
    typeClass: { getAll: () => TYPE[] | Readonly<TYPE[]> },
    typeDataPath: string[] = [],
  ) {
    super(data, copy);
    this.TypeClass = typeClass;
    this.typeDataPath = typeDataPath;
    if (!typeClass || !_.isFunction(typeClass.getAll) || typeClass.getAll === ObjectEnum.getAll) {
      throw new Error('typeClass must implement ObjectEnum.getAll method');
    }
  }

  getType = (): TYPE =>
    this.TypeClass.getAll().find((type) => this.getIn([...this.typeDataPath, type.getValue()]));

  getTypeValue = (): string => {
    const type = this.getType();
    return type && type.getValue();
  };

  hasType = (): boolean => !!this.getType();

  getTypeData = (type?: TYPE): COMBINED_TYPE_DATA => {
    const requestType = type || this.getType();
    return requestType ? this.getIn([...this.typeDataPath, requestType.getValue()]) : undefined;
  };

  mergeWith(...wrappers: SELF[]): SELF {
    super.mergeWith(...wrappers);
    const lastWithType = _.last(wrappers.filter((wrapper) => wrapper?.getType()));

    if (lastWithType) {
      this.appendType(lastWithType.getType(), undefined, false); // removes typeData of other types
    }
    return (this as any) as SELF;
  }

  setType = (type?: TYPE, typeData?: COMBINED_TYPE_DATA, sanitize = true) => {
    let typeDataParent = this.typeDataPath.length === 0 ? this.data : this.getIn(this.typeDataPath);

    if (type && !typeDataParent) {
      this.ensurePath(this.typeDataPath);
      typeDataParent = this.getIn(this.typeDataPath);
    }

    if (typeDataParent) {
      this.TypeClass.getAll().forEach(
        (superfluousProperty) => delete typeDataParent[superfluousProperty.getValue()],
      );
      if (type) {
        const finalTypeData = typeData
          ? sanitize
            ? this.sanitize(type, typeData) || {}
            : _.cloneDeep(typeData)
          : {};
        if (sanitize) {
          omitEmpty(finalTypeData, true);
        }
        typeDataParent[type.getValue()] = finalTypeData;
      }
    }
    return (this as any) as SELF;
  };

  appendType = (type?: TYPE, newTypeData?: COMBINED_TYPE_DATA, sanitize = true) =>
    this.setType(type, { ...this.getTypeData(type), ...newTypeData }, sanitize);

  setTypeData = (newTypeData?: COMBINED_TYPE_DATA, sanitize = true) =>
    this.setType(this.getType(), newTypeData, sanitize);

  appendTypeData(newTypeData?: COMBINED_TYPE_DATA, sanitize = true) {
    return this.appendType(this.getType(), newTypeData, sanitize);
  }

  // should be implemented by derived wrappers
  protected sanitize(type: TYPE, typeData: COMBINED_TYPE_DATA): COMBINED_TYPE_DATA {
    return _.cloneDeep(typeData);
  }
}
