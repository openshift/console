import * as React from 'react';
import * as _ from 'lodash';

import { modelFor } from '../../module/k8s';

export const inject = (children, props) => {
  const safeProps = _.omit(props, ['children']);
  return React.Children.map(children, c => {
    if (!_.isObject(c)) {
      return c;
    }
    return React.cloneElement(c, safeProps);
  });
};

let lastKind = '';

/**
 * @deprecated: Use `modelFor` or `connectToModel`.
 * Provides a synchronous way to acquire a statically-defined Kubernetes model.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */ 
export const kindObj = (kind) => {
  if (_.isString(kind) && kind !== lastKind) {
    // eslint-disable-next-line no-console
    console.warn(`Attempting to get Kubernetes object model using string kind: ${kind}, which is not guaranteed to be unique!`);
    lastKind = kind;
  }
  return modelFor(kind) || {};
};
