/* eslint-disable no-barrel-files/no-barrel-files */
import type { ReactNode, FC } from 'react';
import { connect } from 'react-redux';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import {
  checkAccess,
  impersonateStateToProps,
  ImpersonateKind,
  useAccessReviewAllowed,
  useAccessReview as useAccReview,
} from '@console/dynamic-plugin-sdk';
import {
  AccessReviewResourceAttributes,
  K8sKind,
  K8sResourceKind,
  K8sVerb,
} from '../../module/k8s';

export { checkAccess };

/** @deprecated - Use useAccessReview from \@console/dynamic-plugin-sdk instead. */
export const useAccessReview2 = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
) => useAccReview(resourceAttributes, impersonate);

/** @deprecated - Use useAccessReview from \@console/dynamic-plugin-sdk instead. */
export const useAccessReview = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
) => useAccessReviewAllowed(resourceAttributes, impersonate);

type RequireCreatePermissionOwnProps = {
  model: K8sKind;
  namespace?: string;
  children?: ReactNode;
};

type RequireCreatePermissionProps = RequireCreatePermissionOwnProps & {
  impersonate?: ImpersonateKind;
};

const RequireCreatePermission_: FC<RequireCreatePermissionProps> = ({
  model,
  namespace,
  impersonate,
  children,
}) => {
  const isAllowed = useAccessReviewAllowed(
    {
      group: model?.apiGroup,
      resource: model?.plural,
      verb: 'create',
      namespace,
    },
    impersonate,
  );
  return isAllowed ? <>{children}</> : null;
};

export const RequireCreatePermission = connect<
  { impersonate?: ImpersonateKind },
  {},
  RequireCreatePermissionOwnProps
>(impersonateStateToProps)(RequireCreatePermission_);

RequireCreatePermission.displayName = 'RequireCreatePermission';

export const asAccessReview = (
  kindObj: K8sKind,
  obj: K8sResourceKind,
  verb: K8sVerb,
  subresource?: string,
): AccessReviewResourceAttributes => {
  if (!obj) {
    console.warn('review obj should not be null'); // eslint-disable-line no-console
    return null;
  }
  return {
    group: kindObj.apiGroup,
    resource: kindObj.plural,
    name: getName(obj),
    namespace: getNamespace(obj),
    verb,
    subresource,
  };
};
