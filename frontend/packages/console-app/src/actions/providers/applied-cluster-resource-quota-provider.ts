import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Action } from '@console/dynamic-plugin-sdk';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { AppliedClusterResourceQuotaModel } from '@console/internal/models';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';

const useEditAppliedClusterResourceQuotaActions = (
  resource: K8sResourceKind,
  namespace: string,
) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const factory = useMemo(
    () => ({
      editResourceQuota: () => ({
        id: 'edit-resource-quota',
        label: t('public~Edit AppliedClusterResourceQuota'),
        cta: () =>
          navigate(
            `/k8s/ns/${namespace}/${referenceForModel(AppliedClusterResourceQuotaModel)}/${
              resource?.metadata?.name
            }/yaml`,
          ),
        accessReview: asAccessReview(AppliedClusterResourceQuotaModel, resource, 'update'),
      }),
    }),
    [t, resource, navigate, namespace],
  );

  const action = useMemo<Action[]>(() => [factory.editResourceQuota()], [factory]);
  return action;
};

export const useAppliedClusterResourceQuotaActionsProvider = (data: {
  quota: K8sResourceKind;
  namespace: string;
}) => {
  const { quota, namespace } = data;
  const [kindObj, inFlight] = useK8sModel(referenceFor(quota));
  const [editLabelsAction, isLabelActionReady] = useCommonActions(kindObj, quota, [
    CommonActionCreator.ModifyLabels,
  ] as const);
  const [editAnnotationsAction, isAnnotationActionReady] = useCommonActions(kindObj, quota, [
    CommonActionCreator.ModifyAnnotations,
  ] as const);
  const [editDeleteAction, isDeleteActionReady] = useCommonActions(kindObj, quota, [
    CommonActionCreator.Delete,
  ] as const);
  const editLabels = useMemo(() => (isLabelActionReady ? Object.values(editLabelsAction) : []), [
    editLabelsAction,
    isLabelActionReady,
  ]);
  const editAnnotations = useMemo(
    () => (isAnnotationActionReady ? Object.values(editAnnotationsAction) : []),
    [editAnnotationsAction, isAnnotationActionReady],
  );
  const deleteQuota = useMemo(() => (isDeleteActionReady ? Object.values(editDeleteAction) : []), [
    editDeleteAction,
    isDeleteActionReady,
  ]);
  const editAppliedClusterResourceQuotaActions = useEditAppliedClusterResourceQuotaActions(
    quota,
    namespace,
  );
  const resourceQuotaActions = useMemo(
    () => [
      ...editLabels,
      ...editAnnotations,
      ...editAppliedClusterResourceQuotaActions,
      ...deleteQuota,
    ],
    [editLabels, editAnnotations, editAppliedClusterResourceQuotaActions, deleteQuota],
  );
  return [resourceQuotaActions, !inFlight, false];
};
