import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { Action } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import type { CustomResourceDefinitionKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

const useViewInstancesCRDAction = (resource: CustomResourceDefinitionKind): Action[] => {
  const navigate = useNavigate();
  const { t } = useTranslation('console-app');
  const factory = useMemo(
    () => ({
      ViewInstances: (): Action => ({
        id: 'view-instances-crd',
        label: t('View instances'),
        cta: () =>
          navigate(
            `${resourcePathFromModel(CustomResourceDefinitionModel, resource.metadata.name)}/instances`,
          ),
      }),
    }),
    [navigate, resource, t],
  );

  const action = useMemo<Action[]>(() => [factory.ViewInstances()], [factory]);

  return action;
};

export const useCustomResourceDefinitionActionsProvider = (
  resource: CustomResourceDefinitionKind,
): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const commonActions = useCommonResourceActions(kindObj, resource);
  const viewInstancesAction = useViewInstancesCRDAction(resource);
  const actions = useMemo<Action[]>(
    () => [...viewInstancesAction, ...commonActions],
    [commonActions, viewInstancesAction],
  );
  return [actions, !inFlight, false];
};
