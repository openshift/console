import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CommonActionCreator } from '@console/app/src/actions/hooks/types';
import { useCommonActions } from '@console/app/src/actions/hooks/useCommonActions';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import DisableDefaultSourceModalProvider from '../../components/modals/disable-default-source-modal';
import { OperatorHubKind } from '../../components/operator-hub';
import { DEFAULT_SOURCE_NAMESPACE } from '../../const';
import { OperatorHubModel } from '../../models';
import { CatalogSourceKind } from '../../types';
import useOperatorHubConfig from '../../utils/useOperatorHubConfig';

const useDisableSourceAction = (operatorHub: OperatorHubKind, sourceName: string): Action[] => {
  const { t } = useTranslation();
  const launchOverlay = useOverlay();
  const factory = useMemo(
    () => ({
      disableSource: () => ({
        id: 'disable-source',
        label: t('olm~Disable'),
        cta: () =>
          launchOverlay(DisableDefaultSourceModalProvider, {
            kind: OperatorHubModel,
            operatorHub,
            sourceName,
          }),
        accessReview: asAccessReview(OperatorHubModel, operatorHub, 'patch'),
      }),
    }),
    [t, operatorHub, sourceName, launchOverlay],
  );
  const action = useMemo(() => [factory.disableSource()], [factory]);
  return action;
};

export const useCatalogSourceActionsProvider = (catalogSource: CatalogSourceKind) => {
  const [operatorHub, operatorHubLoaded, operatorHubLoadError] = useOperatorHubConfig();
  const [kindObj, inFlight] = useK8sModel(referenceFor(catalogSource));
  const sourceName = catalogSource?.metadata?.name;
  const namespace = catalogSource?.metadata?.namespace;
  const disableSourceAction = useDisableSourceAction(operatorHub, sourceName);
  const commonActions = useCommonResourceActions(kindObj, catalogSource);
  const [editAction, isReady] = useCommonActions(kindObj, catalogSource, [
    CommonActionCreator.Edit,
  ]);
  const commonEditAction = useMemo(() => (isReady ? Object.values(editAction) : []), [
    editAction,
    isReady,
  ]);
  const isDefaultSource = useMemo(
    () =>
      DEFAULT_SOURCE_NAMESPACE === namespace &&
      operatorHub?.status?.sources?.some((source) => source.name === sourceName),
    [sourceName, namespace, operatorHub?.status?.sources],
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
