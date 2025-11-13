import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Action, useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import {
  CustomResourceDefinitionKind,
  referenceFor,
  referenceForCRD,
} from '@console/internal/module/k8s';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

const crdInstancesPath = (crd: CustomResourceDefinitionKind) =>
  _.get(crd, 'spec.scope') === 'Namespaced'
    ? `/k8s/all-namespaces/${referenceForCRD(crd)}`
    : `/k8s/cluster/${referenceForCRD(crd)}`;

const useViewInstancesCRDAction = (resource: CustomResourceDefinitionKind): Action[] => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const factory = useMemo(
    () => ({
      ViewInstances: (): Action => ({
        id: 'view-instances-crd',
        label: t('console-app~View instances'),
        cta: () => navigate(crdInstancesPath(resource)),
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
  const actions = useMemo<Action[]>(() => [...viewInstancesAction, ...commonActions], [
    commonActions,
    viewInstancesAction,
  ]);
  return [actions, !inFlight, false];
};
