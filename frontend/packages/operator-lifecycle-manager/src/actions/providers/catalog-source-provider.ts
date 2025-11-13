import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CommonActionCreator } from '@console/app/src/actions/hooks/types';
import { useCommonActions } from '@console/app/src/actions/hooks/useCommonActions';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { disableDefaultSourceModal } from '../../components/modals/disable-default-source-modal';
import { OperatorHubKind } from '../../components/operator-hub';
import { DEFAULT_SOURCE_NAMESPACE } from '../../const';
import { OperatorHubModel } from '../../models';
import useOperatorHubConfig from '../../utils/useOperatorHubConfig';

const useDisableSourceAction = (operatorHub: OperatorHubKind, sourceName: string): Action[] => {
  const { t } = useTranslation();
  const factory = useMemo(
    () => ({
      disableSource: () => ({
        id: 'disable-source',
        label: t('olm~Disable'),
        cta: () => disableDefaultSourceModal({ kind: OperatorHubModel, operatorHub, sourceName }),
        accessReview: asAccessReview(OperatorHubModel, operatorHub, 'patch'),
      }),
    }),
    [t, operatorHub, sourceName],
  );
  const action = useMemo(() => [factory.disableSource()], [factory]);
  return action;
};

export const useCatalogSourceActionsProvider = (data) => {
  const resource = useMemo(() => (data?.obj ? data.obj : data), [data]);
  const [operatorHub, operatorHubLoaded, operatorHubLoadError] = useOperatorHubConfig();
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const sourceName = useMemo(() => resource?.metadata?.name, [resource?.metadata?.name]);
  const disableSourceAction = useDisableSourceAction(operatorHub, sourceName);
  const commonActions = useCommonResourceActions(kindObj, resource);
  const [editAction, isReady] = useCommonActions(kindObj, resource, [CommonActionCreator.Edit]);
  const commonEditAction = useMemo(() => (isReady ? Object.values(editAction) : []), [
    editAction,
    isReady,
  ]);
  const isDefaultSource = useMemo(
    () =>
      DEFAULT_SOURCE_NAMESPACE === data?.namespace &&
      operatorHub?.status?.sources?.some((source) => source.name === data?.name),
    [data?.name, data?.namespace, operatorHub?.status?.sources],
  );
  const actions = useMemo(
    () => (isDefaultSource ? [...commonEditAction, ...disableSourceAction] : [...commonActions]),
    [commonActions, commonEditAction, isDefaultSource, disableSourceAction],
  );
  return useMemo(
    () => [operatorHubLoaded && !operatorHubLoadError ? actions : [], !inFlight, undefined],
    [operatorHubLoaded, operatorHubLoadError, actions, inFlight],
  );
};

export const catalogSourceActionsProvider = {
  useCatalogSourceActionsProvider,
};
