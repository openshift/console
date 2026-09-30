import { useMemo } from 'react';
import { Alert, Content, ContentVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import type { Action } from '@console/dynamic-plugin-sdk';
import type { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import type { ClusterExtensionKind } from '../../types';

export const useClusterExtensionActionsProvider: ExtensionHook<Action[], ClusterExtensionKind> = (
  resource,
) => {
  const { t } = useTranslation('olm-v1');
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const deleteMessage = useMemo(
    () => (
      <Alert
        className="co-alert"
        isInline
        variant="warning"
        title={t(
          'Deleting this ClusterExtension also deletes the objects it manages. This can include CustomResourceDefinitions.',
        )}
      >
        <Content component={ContentVariants.p}>
          {t(
            'If a CustomResourceDefinition is deleted, every custom resource created from it is permanently deleted along with it. This includes resources created by you or your team. This data cannot be recovered, and reinstalling the extension will not restore it.',
          )}
        </Content>
        <Content component={ContentVariants.p}>
          {t(
            'Leave the checkbox below checked to delete these managed objects. Clear it to leave them running on the cluster with no extension managing them, which means they will no longer be updated or removed automatically.',
          )}
        </Content>
      </Alert>
    ),
    [t],
  );

  const commonActions = useCommonResourceActions(kindObj, resource, deleteMessage);
  const actions = useMemo(() => [...commonActions], [commonActions]);

  return [actions, !inFlight, undefined];
};
