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
        data-test="cascading-delete-warning"
        isInline
        variant="warning"
        title={t('By default, deleting this ClusterExtension also deletes the objects it manages.')}
      >
        <Content component={ContentVariants.p} data-test="cascading-delete-data-loss">
          {t(
            "These objects might include CustomResourceDefinitions. When you delete a CustomResourceDefinition, you also permanently delete every custom resource based on it, including resources that you or your team created. You can't recover this data, and reinstalling the extension doesn't restore it. Before you delete, download the YAML for any custom resources that you want to keep.",
          )}
        </Content>
        <Content component={ContentVariants.p} data-test="cascading-delete-checkbox-guidance">
          {t(
            'To delete these managed objects, keep the Delete dependent objects of this resource checkbox selected. To keep them running on the cluster, clear the checkbox. If you clear it, no extension manages these objects, so you must update or remove them yourself.',
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
