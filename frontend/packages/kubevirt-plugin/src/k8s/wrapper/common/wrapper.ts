import * as _ from 'lodash';
import { ensurePath } from '../utils/utils';

export class Wrapper<RESOURCE extends {}, SELF extends Wrapper<RESOURCE, SELF>> {
  protected data: RESOURCE;

  protected static defaultMergeWrappers = <A, B extends Wrapper<A, any>>(
    Clazz,
    wrappers: B[],
  ): B => {
    const nonEmptyWrappers = wrappers.filter((i) => i);
    if (nonEmptyWrappers.length === 0) {
      return new Clazz();
    }

    const mergedWrappers: A = _.merge({}, ...nonEmptyWrappers.map((i) => i.data));

    return new Clazz(mergedWrappers);
  };

  constructor(data: RESOURCE, copy = false) {
    this.data = (data && copy ? _.cloneDeep(data) : data || {}) as any;
  }

  public mergeWith(...wrappers: SELF[]) {
    if (wrappers) {
      const update = _.merge(
        {},
        wrappers.filter((w) => w?.data).map((w) => w.data),
      );

      _.merge(this.data, _.cloneDeep(update)); // clone to dispose of all old references
    }
    return this;
  }

  public asResource = (copy = false): RESOURCE => (copy ? _.cloneDeep(this.data) : this.data);

  protected get = (key: string) => (this.data && key ? this.data[key] : null);

  protected getIn = (path: string[]) => (this.data && path ? _.get(this.data, path) : null);

  protected ensurePath = (path: string[] | string, value: any[] | {} = {}) =>
    ensurePath(this.data, path, value);
}
