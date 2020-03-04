import * as _ from 'lodash';

export const omitEmpty = (obj, justUndefined = false) => {
  const omit = (o) => {
    if (_.isObject(o)) {
      Object.keys(o).forEach((k) => {
        const value = o[k];
        if (value === undefined || (!justUndefined && value === null)) {
          delete o[k];
        } else {
          omit(value);
        }
      });
    } else if (_.isArray(o)) {
      o.forEach((item) => omit(item));
    }
  };
  return omit(obj);
};
