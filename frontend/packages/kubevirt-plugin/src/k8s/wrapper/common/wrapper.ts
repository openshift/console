import * as _ from 'lodash';
import { ensurePath } from '../utils/utils';
import { omitEmpty } from '../../../utils/common';

export abstract class Wrapper<RESOURCE extends {}, SELF extends Wrapper<RESOURCE, SELF>> {
  protected data: RESOURCE;

  constructor(data?: RESOURCE | SELF, copy = false) {
    const d = _.isFunction((data as any)?.asResource)
      ? (data as SELF).asResource()
      : (data as RESOURCE);
    this.data = (d && copy ? _.cloneDeep(d) : d || {}) as any;
  }

  asResource = (copy = false): RESOURCE => (copy ? _.cloneDeep(this.data) : this.data);

  mergeWith(...wrappers: SELF[]): SELF {
    if (wrappers) {
      const update = _.merge({}, ...wrappers.filter((w) => w?.data).map((w) => w.data));

      _.merge(this.data, _.cloneDeep(update)); // clone to dispose of all old references
    }
    return (this as any) as SELF;
  }

  omitEmpty = (path?: string[] | string, justUndefined = true) => {
    omitEmpty(path ? this.getIn(path) : this.data, justUndefined);
    return (this as any) as SELF;
  };

  protected get = (key: string) => (this.data && key ? this.data[key] : null);

  protected getIn = (path: string[] | string) =>
    this.data && path ? _.get(this.data, path) : null;

  protected ensurePath = (path: string[] | string, value: any[] | {} = {}) =>
    ensurePath(this.data, path, value);

  protected clearIfEmpty = (path: string[] | string) => {
    if (path && path.length > 0) {
      const arrPath = _.isString(path) ? path.split('.') : [...path];
      const childKey = arrPath.pop();
      const parent = arrPath.length > 0 ? this.getIn(arrPath) : this.data;
      if (parent && parent.hasOwnProperty(childKey) && _.isEmpty(parent[childKey])) {
        delete parent[childKey];
      }
    }
    return (this as any) as SELF;
  };
}
