import * as React from 'react';
import * as _ from 'lodash';
import { K8sVerb } from '../../../api/common-types';
import {
  AccessReviewResourceAttributes,
  SelfSubjectAccessReviewKind,
} from '../../../extensions/console-types';
import { ProjectModel, SelfSubjectAccessReviewModel } from '../../../models';
import { k8sCreate } from '../../../utils/k8s/k8s-resource';
import { getImpersonate } from '../../core/reducers/coreSelectors';
import { ImpersonateKind } from '../../redux-types';
import storeHandler from '../../storeHandler';
import { useSafetyFirst } from '../safety-first';

/**
 * Generates a cache key for impersonation context from Redux store state.
 *
 * This internal utility creates stable cache keys for RBAC requests when user impersonation
 * is active, ensuring proper access review caching across different impersonation contexts.
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
 * @returns Memoized result of the access review.
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
  (...args) => args.join('~'),
);

/**
 * Performs a Kubernetes access review to determine if the current user has permission for a specific resource operation.
 *
 * **Note:** For React components, use the `useAccessReview` hook instead of calling this function directly.
 * This function is primarily intended for non-React contexts and programmatic permission checks.
 *
 * **Common use cases:**
 * - Permission checks in utility functions and services
 * - Conditional logic outside of React components
 * - One-time permission validation in event handlers
 * - Server-side or non-React permission checks
 *
 * **Access review process:**
 * - Creates SelfSubjectAccessReview API request
 * - Handles impersonation context automatically
 * - Returns cached results for identical requests
 * - Follows Kubernetes RBAC evaluation rules
 *
 * @example
 * ```tsx
 * // Non-React permission check
 * const validateUserAction = async (namespace: string) => {
 *   const result = await checkAccess({
 *     group: '',
 *     resource: 'pods',
 *     verb: 'create',
 *     namespace
 *   });
 *   return result.status.allowed;
 * };
 *
 * // For React components, use useAccessReview instead:
 * const MyComponent: React.FC = () => {
 *   const [canCreate] = useAccessReview({
 *     group: '',
 *     resource: 'pods',
 *     verb: 'create',
 *     namespace: 'default'
 *   });
 *
 *   return canCreate ? <CreateButton /> : null;
 * };
 * ```
 *
 * @param resourceAttributes Object containing resource details for the access review
 * @param impersonate Optional impersonation context for the permission check
 * @returns Promise resolving to SelfSubjectAccessReview response containing permission status
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
 * React hook that provides user permission status for specific Kubernetes resource operations.
 *
 * This is the recommended way to check user permissions in React components. It handles
 * loading states, caching, and error conditions automatically while providing a clean
 * React-friendly API.
 *
 * **Common use cases:**
 * - Conditionally rendering create/edit/delete buttons
 * - Showing/hiding menu items based on permissions
 * - Disabling form fields for read-only users
 * - Implementing fine-grained access control in UIs
 *
 * **Hook behavior:**
 * - Starts with loading=true, isAllowed=false
 * - Performs async access review on mount and when dependencies change
 * - Updates state when permission check completes
 * - Defaults to allowing access if permission check fails (fail-open)
 *
 * **Error handling:**
 * - Network failures default to allowing access (server enforces final permissions)
 * - Logs errors to console for debugging
 * - Never blocks UI indefinitely due to permission check failures
 * - Graceful degradation ensures functional UI even with RBAC issues
 *
 * **Performance considerations:**
 * - Results are cached to avoid redundant API calls
 * - Prevents state updates on unmounted components
 * - Efficiently handles dependency changes without excessive re-renders
 *
 * @example
 * ```tsx
 * // Basic permission-based rendering
 * const CreatePodButton: React.FC<{namespace: string}> = ({namespace}) => {
 *   const [canCreate, loading] = useAccessReview({
 *     group: '',
 *     resource: 'pods',
 *     verb: 'create',
 *     namespace
 *   });
 *
 *   if (loading) {
 *     return <Spinner size="sm" />;
 *   }
 *
 *   return canCreate ? (
 *     <Button variant="primary">Create Pod</Button>
 *   ) : (
 *     <Tooltip content="You don't have permission to create pods">
 *       <Button variant="primary" isDisabled>Create Pod</Button>
 *     </Tooltip>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Multiple permission checks
 * const ResourceActions: React.FC<{resource: K8sResourceKind, model: K8sModel}> = ({resource, model}) => {
 *   const [canEdit] = useAccessReview({
 *     group: model.apiGroup || '',
 *     resource: model.plural,
 *     verb: 'update',
 *     name: resource.metadata.name,
 *     namespace: resource.metadata.namespace
 *   });
 *
 *   const [canDelete] = useAccessReview({
 *     group: model.apiGroup || '',
 *     resource: model.plural,
 *     verb: 'delete',
 *     name: resource.metadata.name,
 *     namespace: resource.metadata.namespace
 *   });
 *
 *   return (
 *     <div className="resource-actions">
 *       {canEdit && <Button onClick={editResource}>Edit</Button>}
 *       {canDelete && <Button variant="danger" onClick={deleteResource}>Delete</Button>}
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Conditional form field access
 * const ResourceForm: React.FC<{resource: K8sResourceKind, model: K8sModel}> = ({resource, model}) => {
 *   const [canUpdateSpec] = useAccessReview({
 *     group: model.apiGroup || '',
 *     resource: model.plural,
 *     subresource: 'spec',
 *     verb: 'update',
 *     namespace: resource.metadata.namespace
 *   });
 *
 *   return (
 *     <Form>
 *       <FormGroup label="Name">
 *         <TextInput value={resource.metadata.name} isDisabled />
 *       </FormGroup>
 *       <FormGroup label="Replicas">
 *         <NumberInput
 *           value={resource.spec.replicas}
 *           isDisabled={!canUpdateSpec}
 *           onChange={updateReplicas}
 *         />
 *       </FormGroup>
 *     </Form>
 *   );
 * };
 * ```
 *
 * @param resourceAttributes Object containing resource details for the access review
 * @param impersonate Optional impersonation context for the permission check
 * @param noCheckForEmptyGroupAndResource Optional flag to skip check when group and resource are empty
 * @returns Tuple containing [isAllowed: boolean, loading: boolean] - isAllowed indicates if user has permission, loading indicates if check is in progress
 */
export const useAccessReview = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
  noCheckForEmptyGroupAndResource?: boolean,
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
  const skipCheck = noCheckForEmptyGroupAndResource && !group && !resource;
  React.useEffect(() => {
    if (skipCheck) {
      setAllowed(false);
      setLoading(false);
      return;
    }
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
  }, [
    setLoading,
    setAllowed,
    group,
    resource,
    subresource,
    verb,
    name,
    namespace,
    impersonateKey,
    skipCheck,
  ]);

  return [isAllowed, loading];
};

/**
 * @deprecated - Use useAccessReview from \@console/dynamic-plugin-sdk instead.
 * Hook that provides allowed status about user access to a given resource.
 * @param resourceAttributes resource attributes for access review
 * @param impersonate impersonation details
 * @returns The isAllowed boolean value.
 */
export const useAccessReviewAllowed = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
): boolean => {
  return useAccessReview(resourceAttributes, impersonate)[0];
};
