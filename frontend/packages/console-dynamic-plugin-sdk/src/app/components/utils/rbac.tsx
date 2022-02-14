import * as React from 'react';
import * as _ from 'lodash';
import {
  AccessReviewResourceAttributes,
  K8sVerb,
  SelfSubjectAccessReviewKind,
} from '../../../extensions/console-types';
import { ProjectModel, SelfSubjectAccessReviewModel } from '../../../models';
import { k8sCreate } from '../../../utils/k8s/k8s-resource';
import { getActiveCluster, getImpersonate } from '../../core/reducers/coreSelectors';
import { ImpersonateKind } from '../../redux-types';
import storeHandler from '../../storeHandler';
import { useSafetyFirst } from '../safety-first';

/**
 * It provides impersonation key based on data from the redux store.
 */
const getImpersonateKey = (impersonate?: ImpersonateKind): string => {
  const newImpersonate = impersonate || getImpersonate(storeHandler.getStore().getState());
  return newImpersonate ? `${newImpersonate.kind}~${newImpersonate.name}` : '';
};

/**
 * Memoizes the result so it is possible to only make the request once for each access review.
 * This does mean that the user will have to refresh the page to see updates.
 * Function takes in the destructured resource attributes so that the cache keys are stable.
 * `JSON.stringify` is not guaranteed to give the same result for equivalent objects.
 * Impersonate headers are added automatically by `k8sCreate`.
 * @param group resource group.
 * @param resource resource string.
 * @param subresource subresource string.
 * @param verb K8s verb.
 * @param namespace namespace.
 * @param impersonateKey parameter to include in the cache key even though it's not used in the function body.
 * @return Memoized result of the access review.
 */
const checkAccessInternal = _.memoize(
  (
    group: string,
    resource: string,
    subresource: string,
    verb: K8sVerb,
    name: string,
    namespace: string,
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    impersonateKey: string,
  ): Promise<SelfSubjectAccessReviewKind> => {
    // Projects are a special case. `namespace` must be set to the project name
    // even though it's a cluster-scoped resource.
    const reviewNamespace =
      group === ProjectModel.apiGroup && resource === ProjectModel.plural ? name : namespace;
    const ssar: SelfSubjectAccessReviewKind = {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group,
          resource,
          subresource,
          verb,
          name,
          namespace: reviewNamespace,
        },
      },
    };
    return k8sCreate(SelfSubjectAccessReviewModel, ssar);
  },
  (...args) => [...args, getActiveCluster(storeHandler.getStore().getState())].join('~'),
);

/**
 * Provides information about user access to a given resource.
 * @param resourceAttributes resource attributes for access review
 * @param impersonate impersonation details
 * @return Object with resource access information.
 */
export const checkAccess = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
): Promise<SelfSubjectAccessReviewKind> => {
  // Destructure the attributes with defaults so we can create a stable cache key.
  const {
    group = '',
    resource = '',
    subresource = '',
    verb = '' as K8sVerb,
    name = '',
    namespace = '',
  } = resourceAttributes || {};
  return checkAccessInternal(
    group,
    resource,
    subresource,
    verb,
    name,
    namespace,
    getImpersonateKey(impersonate),
  );
};

/**
 * Hook that provides information about user access to a given resource.
 * @param resourceAttributes resource attributes for access review
 * @param impersonate impersonation details
 * @return Array with isAllowed and loading values.
 */
export const useAccessReview = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
): [boolean, boolean] => {
  const [loading, setLoading] = useSafetyFirst(true);
  const [isAllowed, setAllowed] = useSafetyFirst(false);
  // Destructure the attributes to pass them as dependencies to `useEffect`,
  // which doesn't do deep comparison of object dependencies.
  const {
    group = '',
    resource = '',
    subresource = '',
    verb = '' as K8sVerb,
    name = '',
    namespace = '',
  } = resourceAttributes;
  const impersonateKey = getImpersonateKey(impersonate);
  React.useEffect(() => {
    checkAccessInternal(group, resource, subresource, verb, name, namespace, impersonateKey)
      .then((result: SelfSubjectAccessReviewKind) => {
        setAllowed(result.status.allowed);
        setLoading(false);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('SelfSubjectAccessReview failed', e);
        // Default to enabling the action if the access review fails so that we
        // don't incorrectly block users from actions they can perform. The server
        // still enforces access control.
        setAllowed(true);
        setLoading(false);
      });
  }, [setLoading, setAllowed, group, resource, subresource, verb, name, namespace, impersonateKey]);

  return [isAllowed, loading];
};

/**
 * Hook that provides allowed status about user access to a given resource.
 * @param resourceAttributes resource attributes for access review
 * @param impersonate impersonation details
 * @return The isAllowed boolean value.
 */
export const useAccessReviewAllowed = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
): boolean => {
  return useAccessReview(resourceAttributes, impersonate)[0];
};
