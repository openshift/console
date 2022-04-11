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
 * Cache promises and the results so that we can skip duplicate network calls,
 * independently of the fact if the promise is pending or resolved.
 *
 * This mean that the user will have to refresh the page to see updates.
 * TODO: This would also allow us to clear the cache on (un)impersonate and login/logout!
 *
 * TODO: Instead of saving the complete SSAR holding we should just save a boolean here!
 * But that's not possible until we replace @console/internal `useMultipleAccessReviews`.
 */
const promiseCache = new Map<string, Promise<SelfSubjectAccessReviewKind>>();
const resultCache = new Map<string, boolean>();

/**
 * Create a cache key based on the given resource and the redux store.
 *
 * Function takes in the destructured resource attributes so that the cache keys are stable.
 * `JSON.stringify` is not guaranteed to give the same result for equivalent objects.
 * Impersonate headers are added automatically by `k8sCreate`.
 *
 * @param group resource group.
 * @param resource resource string.
 * @param subresource subresource string.
 * @param verb K8s verb.
 * @param name resource name.
 * @param namespace resource namespace.
 * @param impersonate impersonate parameter.
 * @returns Identifier for the cache.
 */
const getCacheKey = (
  group: string,
  resource: string,
  subresource: string,
  verb: K8sVerb,
  name: string,
  namespace: string,
  impersonate?: ImpersonateKind,
) => {
  const newImpersonate = impersonate || getImpersonate(storeHandler.getStore().getState());
  return [
    group,
    resource,
    subresource,
    verb,
    name,
    namespace,
    newImpersonate ? `${newImpersonate.kind}~${newImpersonate.name}` : '',
    getActiveCluster(storeHandler.getStore().getState()),
  ].join('~');
};

/**
 * Fetch the SSAR for the given resource.
 *
 * Impersonate headers are added automatically by `k8sCreate`.
 *
 * @param group resource group.
 * @param resource resource string.
 * @param subresource subresource string.
 * @param verb K8s verb.
 * @param name resource name.
 * @param namespace resource namespace.
 * @param impersonate impersonate parameter.
 * @returns Promise for the SSAR resource.
 */
const fetchSSAR = (
  group: string,
  resource: string,
  subresource: string,
  verb: K8sVerb,
  name: string,
  namespace: string,
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
};

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
  const cacheKey = getCacheKey(group, resource, subresource, verb, name, namespace, impersonate);

  // If a fetch is already in-flight, just return it.
  let promise = promiseCache.get(cacheKey);
  if (promise) {
    return promise;
  }

  // Otherwise make a new network call and save this promise for the next call.
  promise = fetchSSAR(group, resource, subresource, verb, name, namespace);
  promiseCache.set(cacheKey, promise);
  return promise.then((ssar) => {
    resultCache.set(cacheKey, ssar.status.allowed);
    return ssar;
  });
};

/**
 * Prefetch information about user access to a given resource.
 *
 * @param resourceAttributes resource attributes for access review, could be null.
 * @param impersonate impersonation details
 */
export const prefetchCheckAccess = (
  resourceAttributes: AccessReviewResourceAttributes | null,
  impersonate?: ImpersonateKind,
): void => {
  if (resourceAttributes) {
    checkAccess(resourceAttributes, impersonate).catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('SelfSubjectAccessReview prefetch failed:', error);
    });
  }
};

/**
 * Hook that provides information about user access to a given resource.
 * @param resourceAttributes resource attributes for access review, null to skip access check.
 * @param impersonate impersonation details
 * @return Array with isAllowed and loading values.
 */
export const useAccessReview = (
  resourceAttributes: AccessReviewResourceAttributes | null,
  impersonate?: ImpersonateKind,
): [boolean, boolean] => {
  // Destructure the attributes to pass them as dependencies to `useEffect`,
  // which doesn't do deep comparison of object dependencies.
  const {
    group = '',
    resource = '',
    subresource = '',
    verb = '' as K8sVerb,
    name = '',
    namespace = '',
  } = resourceAttributes || {};

  const [state, unsafeSetState] = useSafetyFirst<[boolean, boolean]>(() => {
    // Calculate the initial state based on the cached SSAR and the initial resourceAttributes.
    const cacheKey = getCacheKey(group, resource, subresource, verb, name, namespace, impersonate);
    const result = resultCache.get(cacheKey);
    // Found cached result, take it and set start directly with loading false
    if (typeof result === 'boolean') {
      return [result, false];
    }
    // Resource is defined, so we will fetch data in useEffect (allowed false until promise is resolved)
    if (resourceAttributes) {
      return [false, true];
    }
    // Resource is not defined, so we can start directly with allowed true and loading false.
    return [true, false];
  });

  // Do not rerender when state doesn't change.
  const setState = React.useCallback(
    (newState: [boolean, boolean]) => {
      unsafeSetState((oldState) =>
        newState[0] !== oldState[0] || newState[1] !== oldState[1] ? newState : oldState,
      );
    },
    [unsafeSetState],
  );

  const noResource = !resourceAttributes;
  React.useEffect(() => {
    // resourceAttributes can be changed from an initial value to null.
    // In this case we should switch from any state to allowed and loading false as well.
    if (noResource) {
      // Similar result to the error case below.
      setState([true, false]);
      return;
    }

    const cacheKey = getCacheKey(group, resource, subresource, verb, name, namespace, impersonate);
    const result = resultCache.get(cacheKey);

    // If we found a result which is resolved in the meantime we can just use it.
    if (typeof result === 'boolean') {
      setState([result, false]);
      return;
    }

    // If a fetch is already in-flight, we can attach to it. Otherwise we need to start a new one.
    let promise = promiseCache.get(cacheKey);
    if (!promise) {
      promise = fetchSSAR(group, resource, subresource, verb, name, namespace);
      promiseCache.set(cacheKey, promise);
      promise = promise.then((ssar) => {
        resultCache.set(cacheKey, ssar.status.allowed);
        return ssar;
      });
    }
    promise
      .then((ssar) => setState([ssar.status.allowed, false]))
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('SelfSubjectAccessReview failed', e);
        // Default to enabling the action if the access review fails so that we
        // don't incorrectly block users from actions they can perform. The server
        // still enforces access control.
        setState([true, false]);
      });
  }, [noResource, group, resource, subresource, verb, name, namespace, setState, impersonate]);

  return state;
};

/**
 * Hook that provides allowed status about user access to a given resource.
 * @param resourceAttributes resource attributes for access review, null to skip access check.
 * @param impersonate impersonation details
 * @return The isAllowed boolean value.
 */
export const useAccessReviewAllowed = (
  resourceAttributes: AccessReviewResourceAttributes | null,
  impersonate?: ImpersonateKind,
): boolean => {
  return useAccessReview(resourceAttributes, impersonate)[0];
};
