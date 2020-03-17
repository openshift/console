import * as _ from 'lodash';

export const ensurePath = (data: {}, path: string[] | string, value: any = {}) => {
  let currentFragment: any = data;
  if (data && path) {
    const arrPath = _.isString(path) ? path.split('.') : path;

    arrPath.forEach((pathElement, idx) => {
      const isLast = idx === arrPath.length - 1;

      const nextFragment = currentFragment[pathElement];

      if (isLast ? nextFragment != null : _.isObject(nextFragment)) {
        currentFragment = nextFragment;
      } else {
        const newFragment = isLast ? value : {};
        currentFragment[pathElement] = newFragment;
        currentFragment = newFragment;
      }
    });
  }

  return currentFragment;
};
