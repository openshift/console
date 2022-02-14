import * as React from 'react';
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

export { checkAccess } from '@console/dynamic-plugin-sdk';

/** @deprecated - Use useAccessReview from \@console/dynamic-plugin-sdk instead. */
export const useAccessReview2 = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
) => useAccReview(resourceAttributes, impersonate);

/** @deprecated - Use useAccessReviewAllowed from \@console/dynamic-plugin-sdk instead. */
export const useAccessReview = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
) => useAccessReviewAllowed(resourceAttributes, impersonate);

export const useMultipleAccessReviews = (
  multipleResourceAttributes: AccessReviewResourceAttributes[],
  impersonate?: ImpersonateKind,
): [AccessReviewsResult[], boolean] => {
  const [loading, setLoading] = React.useState(true);
  const [allowedArr, setAllowedArr] = React.useState<AccessReviewsResult[]>([]);

  React.useEffect(() => {
    const promises = multipleResourceAttributes.map((resourceAttributes) =>
      checkAccess(resourceAttributes, impersonate),
    );

    Promise.all(promises)
      .then((values) => {
        setLoading(false);
        const updatedAllowedArr = values.map<AccessReviewsResult>((result) => ({
          resourceAttributes: result.spec.resourceAttributes,
          allowed: result.status.allowed,
        }));
        setAllowedArr(updatedAllowedArr);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('SelfSubjectAccessReview failed', e);
        setLoading(false);
      });
  }, [impersonate, multipleResourceAttributes]);

  return [allowedArr, loading];
};

const RequireCreatePermission_: React.FC<RequireCreatePermissionProps> = ({
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
export const RequireCreatePermission = connect(impersonateStateToProps)(RequireCreatePermission_);
RequireCreatePermission.displayName = 'RequireCreatePermission';

type RequireCreatePermissionProps = {
  model: K8sKind;
  namespace?: string;
  impersonate?: ImpersonateKind;
  children: React.ReactNode;
};

type AccessReviewsResult = {
  resourceAttributes: AccessReviewResourceAttributes;
  allowed: boolean;
};

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
