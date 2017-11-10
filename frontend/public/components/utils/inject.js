import * as React from 'react';
import {k8sKinds} from '../../module/k8s';

export const inject = (children, props) => {
  const safeProps = _.omit(props, ['children']);
  return React.Children.map(children, c => {
    if (!_.isObject(c)) {
      return c;
    }
    return React.cloneElement(c, safeProps);
  });
};

export const kindObj = kind => _.isString(kind) && k8sKinds[kind] || {};
