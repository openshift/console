import * as _ from 'lodash';

export class Wrapper<RESOURCE extends {}> {
  protected data: RESOURCE;

  protected static defaultMergeWrappers = <A, B extends Wrapper<A>>(Clazz, wrappers: B[]): B => {
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

  asResource = (copy = false): RESOURCE => (copy ? _.cloneDeep(this.data) : this.data);

  protected get = (key: string) => (this.data && key ? this.data[key] : null);

  protected getIn = (path: string[]) => (this.data && path ? _.get(this.data, path) : null);
}
