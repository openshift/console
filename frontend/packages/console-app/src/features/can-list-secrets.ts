import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { getImpersonate } from '@console/dynamic-plugin-sdk/src/app/core/reducers/coreSelectors';
import type { SelfSubjectAccessReviewKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { FeatureFlagHandler } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { SelfSubjectAccessReviewModel } from '@console/dynamic-plugin-sdk/src/models';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { getNamespace } from '@console/internal/components/utils/link';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { FLAG_CAN_LIST_SECRETS } from '../consts';

/** Provides Secret list access for the current namespace. */
export const useCanListSecrets: FeatureFlagHandler = (setFeatureFlag) => {
  const [activeNamespace] = useActiveNamespace();
  const { pathname } = useLocation();
  const namespace = getNamespace(pathname) || activeNamespace;
  const impersonate = useConsoleSelector(getImpersonate);

  useEffect(() => {
    if (!namespace || namespace === ALL_NAMESPACES_KEY) {
      setFeatureFlag(FLAG_CAN_LIST_SECRETS, false);
      return;
    }
    let active = true;
    k8sCreateResource<SelfSubjectAccessReviewKind>({
      model: SelfSubjectAccessReviewModel,
      data: {
        apiVersion: 'authorization.k8s.io/v1',
        kind: 'SelfSubjectAccessReview',
        spec: { resourceAttributes: { resource: 'secrets', verb: 'list', namespace } },
      },
    })
      .then((review) => {
        if (active) setFeatureFlag(FLAG_CAN_LIST_SECRETS, !!review.status?.allowed);
      })
      .catch(() => {
        // Match useAccessReview: the server still enforces authorization.
        if (active) setFeatureFlag(FLAG_CAN_LIST_SECRETS, true);
      });
    return () => {
      active = false;
    };
  }, [namespace, impersonate, setFeatureFlag]);
};
