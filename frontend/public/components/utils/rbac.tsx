import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';

import store from '../../redux';
import { impersonateStateToProps } from '../../reducers/ui';
import { AccessReviewResourceAttributes, k8sCreate, K8sKind, K8sVerb, SelfSubjectAccessReviewKind } from '../../module/k8s';
import { SelfSubjectAccessReviewModel } from '../../models';

// Memoize the result so we only make the request once for each access review.
// This does mean that the user will have to refresh the page to see updates.
// Accept an `impersonateKey` parameter to include in the cache key even though
// it's not used in the function body. (Impersonate headers are added
// automatically by `k8sCreate`.) This function takes in the destructured
// resource attributes so that the cache keys are stable. (`JSON.stringify` is
// not guaranteed to give the same result for equivalent objects.)
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const checkAccessInternal = _.memoize((group: string, resource: string, subresource: string, verb: K8sVerb, name: string, namespace: string, impersonateKey: string): Promise<SelfSubjectAccessReviewKind> => {
  const ssar: SelfSubjectAccessReviewKind = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    spec: {
      resourceAttributes: { group, resource, subresource, verb, name, namespace },
    },
  };
  return k8sCreate(SelfSubjectAccessReviewModel, ssar);
}, (...args) => args.join('~'));

const getImpersonateKey = (impersonate): string => {
  impersonate = impersonate || store.getState().UI.get('impersonate');
  return impersonate ? `${impersonate.kind}~{impersonate.user}` : '';
};

export const checkAccess = (resourceAttributes: AccessReviewResourceAttributes, impersonate?): Promise<SelfSubjectAccessReviewKind> => {
  // Destructure the attributes with defaults so we can create a stable cache key.
  const {group = '', resource = '', subresource = '', verb = '' as K8sVerb, name = '', namespace = ''} = (resourceAttributes || {});
  return checkAccessInternal(group, resource, subresource, verb, name, namespace, getImpersonateKey(impersonate));
};

export const useAccessReview = (resourceAttributes: AccessReviewResourceAttributes, impersonate?): boolean => {
  const [isAllowed, setAllowed] = React.useState(false);
  // Destructure the attributes to pass them as dependencies to `useEffect`,
  // which doesn't do deep comparison of object dependencies.
  const {group = '', resource = '', subresource = '', verb = '' as K8sVerb, name = '', namespace = ''} = resourceAttributes;
  const impersonateKey = getImpersonateKey(impersonate);
  React.useEffect(() => {
    checkAccessInternal(group, resource, subresource, verb, name, namespace, impersonateKey)
      .then((result: SelfSubjectAccessReviewKind) => {
        setAllowed(result.status.allowed);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('SelfSubjectAccessReview failed', e);
        // Default to enabling the action if the access review fails so that we
        // don't incorrectly block users from actions they can perform. The server
        // still enforces access control.
        setAllowed(true);
      });
  }, [group, resource, subresource, verb, name, namespace, impersonateKey]);

  return isAllowed;
};

const RequireCreatePermission_: React.FC<RequireCreatePermissionProps> = ({model, namespace, impersonate, children}) => {
  const isAllowed = useAccessReview({
    group: model.apiGroup,
    resource: model.path,
    verb: 'create',
    namespace,
  }, impersonate);
  return isAllowed ? <React.Fragment>{children}</React.Fragment> : null;
};
export const RequireCreatePermission = connect(impersonateStateToProps)(RequireCreatePermission_);
RequireCreatePermission.displayName = 'RequireCreatePermission';

type RequireCreatePermissionProps = {
  model: K8sKind;
  namespace?: string;
  impersonate?: string;
  children: React.ReactNode;
};
