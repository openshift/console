import { Children, cloneElement, isValidElement } from 'react';
import * as _ from 'lodash-es';

import { modelFor, kindForReference, K8sResourceKindReference, K8sModel } from '../../module/k8s';

export const inject = (children: React.ReactNode, props: object) => {
  const safeProps = _.omit(props, ['children']);
  return Children.map(children, (c) => {
    if (!_.isObject(c) || !isValidElement(c)) {
      return c;
    }
    return cloneElement(c, safeProps);
  });
};

const lastKind = new Set<K8sResourceKindReference>();

/**
 * @deprecated Use `modelFor` or `connectToModel`.
 * Provides a synchronous way to acquire a statically-defined Kubernetes model.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const kindObj = (kind: K8sResourceKindReference): K8sModel => {
  if (kindForReference(kind) === kind && !lastKind.has(kind)) {
    // eslint-disable-next-line no-console
    console.warn(
      `Attempting to get Kubernetes object model using string kind: ${kind}, which is not guaranteed to be unique!`,
    );
    lastKind.add(kind);
  }
  const model = modelFor(kind);
  if (!model) {
    // eslint-disable-next-line no-console
    console.warn('kindObj: no model for kind', kind);
  }

  // as this is a deprecated function, future refactors should instead remove
  // usage of this function entirely
  return (model || {}) as K8sModel;
};
