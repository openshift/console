import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useDeleteNamespaceModalLauncher } from '@console/internal/components/modals/delete-namespace-modal';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import type { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';

const useDeleteAction = (kindObj: K8sModel, resource: K8sResourceKind) => {
  const { t } = useTranslation();
  const launchDeleteModal = useDeleteNamespaceModalLauncher({ kind: kindObj, resource });
  const hidden = resource.metadata.name === 'default' || resource.status?.phase === 'Terminating';

  const factory = useMemo(
    () => ({
      delete: () => ({
        id: 'delete-project',
        label: t('console-app~Delete {{label}}', { label: t(kindObj.labelKey) }),
        cta: launchDeleteModal,
        accessReview: asAccessReview(kindObj, resource, 'delete'),
      }),
    }),
    // missing launchDeleteModal dependency, that causes max depth exceeded error
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kindObj, resource, t],
  );
  const action = useMemo(() => (!hidden ? [factory.delete()] : []), [factory, hidden]);
  return action;
};

export const useProjectActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [editAction, isReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.Edit,
  ] as const);
  const deleteAction = useDeleteAction(kindObj, resource);
  const projectActions = useMemo(() => (isReady ? Object.values(editAction) : []), [
    editAction,
    isReady,
  ]);
  const actions = useMemo(() => [...projectActions, ...deleteAction], [
    projectActions,
    deleteAction,
  ]);
  return [actions, !inFlight, false];
};

export const useNamespaceActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [commonActions, isReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
    CommonActionCreator.Edit,
  ] as const);
  const deleteAction = useDeleteAction(kindObj, resource);
  const namespaceActions = useMemo(() => (isReady ? Object.values(commonActions) : []), [
    commonActions,
    isReady,
  ]);
  const actions = useMemo(() => [...namespaceActions, ...deleteAction], [
    namespaceActions,
    deleteAction,
  ]);
  return [actions, !inFlight, false];
};
