import * as _ from 'lodash';
import { ensurePath } from '../utils/utils';
import { omitEmpty } from '../../../utils/basic';

export class Wrapper<RESOURCE extends {}, SELF extends Wrapper<RESOURCE, SELF>> {
  protected data: RESOURCE;

  constructor(data?: RESOURCE | SELF, copy = false) {
    const d = _.isFunction((data as any)?.asResource)
      ? (data as SELF).asResource()
      : (data as RESOURCE);
    this.data = (d && copy ? _.cloneDeep(d) : d || {}) as any;
  }

  public asResource = (copy = false): RESOURCE => (copy ? _.cloneDeep(this.data) : this.data);

  public mergeWith(...wrappers: SELF[]): SELF {
    if (wrappers) {
      const update = _.merge({}, ...wrappers.filter((w) => w?.data).map((w) => w.data));

      _.merge(this.data, _.cloneDeep(update)); // clone to dispose of all old references
    }
    return (this as any) as SELF;
  }

  public clearEmptyValues = () => {
    omitEmpty(this.data, true);
  };

  protected get = (key: string) => (this.data && key ? this.data[key] : null);

  protected getIn = (path: string[]) => (this.data && path ? _.get(this.data, path) : null);

  protected ensurePath = (path: string[] | string, value: any[] | {} = {}) =>
    ensurePath(this.data, path, value);
}
