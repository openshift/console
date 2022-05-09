import * as React from 'react';
import i18next from 'i18next';
import * as _ from 'lodash';
import { Action } from '@console/dynamic-plugin-sdk';
import { asAccessReview } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  K8sResourceCommon,
  K8sPodControllerKind,
  K8sKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared';
import { deletePDBModal } from '../../components/pdb/modals';
import { PodDisruptionBudgetKind } from '../../components/pdb/types';
import { getPDBResource } from '../../components/pdb/utils/get-pdb-resources';
import { PodDisruptionBudgetModel } from '../../models';
import { ResourceActionFactory } from './common-factory';

const pdbRoute = ({ metadata: { name, namespace } }: K8sResourceCommon, kindObj: K8sKind) =>
  `/k8s/ns/${namespace}/${referenceForModel(kindObj)}/form?name=${name}`;

const PodDisruptionBudgetActionFactory: ResourceActionFactory = {
  AddPDB: (kindObj: K8sKind, obj: K8sPodControllerKind): Action => ({
    id: 'add-pdb',
    label: i18next.t('console-app~Add PodDisruptionBudget'),
    cta: {
      href: pdbRoute(obj, kindObj),
    },
    accessReview: asAccessReview(kindObj, obj, 'create'),
  }),
  EditPDB: (kindObj: K8sKind, obj: K8sPodControllerKind): Action => ({
    id: 'edit-pdb',
    label: i18next.t('console-app~Edit PodDisruptionBudget'),
    cta: {
      href: pdbRoute(obj, kindObj),
    },
    accessReview: asAccessReview(kindObj, obj, 'patch'),
  }),
  DeletePDB: (
    kindObj: K8sKind,
    obj: K8sPodControllerKind,
    matchedPDB: PodDisruptionBudgetKind,
  ): Action => ({
    id: 'delete-pdb',
    label: i18next.t('console-app~Remove PodDisruptionBudget'),
    insertBefore: 'edit-resource-limits',
    cta: () => {
      deletePDBModal({
        workloadName: obj.metadata.name,
        pdb: matchedPDB,
      });
    },
    accessReview: asAccessReview(kindObj, obj, 'delete'),
  }),
};

const getPDBActions = (
  kind: K8sKind,
  obj: K8sPodControllerKind,
  matchedPDB: PodDisruptionBudgetKind,
): Action[] => {
  if (_.isEmpty(matchedPDB)) return [PodDisruptionBudgetActionFactory.AddPDB(kind, obj)];

  return [
    PodDisruptionBudgetActionFactory.EditPDB(kind, obj),
    PodDisruptionBudgetActionFactory.DeletePDB(kind, obj, matchedPDB),
  ];
};

export const usePDBActions = (kindObj: K8sKind, resource: K8sPodControllerKind) => {
  const [namespace] = useActiveNamespace();
  const watchedResource = React.useMemo(
    () => ({
      isList: true,
      groupVersionKind: {
        group: PodDisruptionBudgetModel.apiGroup,
        kind: PodDisruptionBudgetModel.kind,
        version: PodDisruptionBudgetModel.apiVersion,
      },
      namespace,
      namespaced: true,
    }),
    [namespace],
  );

  const [pdbResources] = useK8sWatchResource<PodDisruptionBudgetKind[]>(watchedResource);

  const matchedPDB = getPDBResource(pdbResources, resource);

  const result = React.useMemo(() => {
    return [getPDBActions(kindObj, resource, matchedPDB)];
  }, [kindObj, matchedPDB, resource]);

  return result;
};
