import * as React from 'react';
import i18next from 'i18next';
import * as _ from 'lodash';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { asAccessReview } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sPodControllerKind, K8sModel, referenceFor } from '@console/internal/module/k8s';
import { deletePDBModal } from '../../components/pdb/modals';
import { PodDisruptionBudgetKind } from '../../components/pdb/types';
import { getPDBResource } from '../../components/pdb/utils/get-pdb-resources';
import { PodDisruptionBudgetModel } from '../../models';
import { PDBActionCreator } from './types';

const pdbRoute = (
  { metadata: { name, namespace } }: K8sPodControllerKind,
  kindObj: K8sModel,
): string => `/k8s/ns/${namespace}/${referenceFor(kindObj)}/form?name=${name}`;

/**
 * A React hook for retrieving actions related to PodDisruptionBudgets (PDB).
 *
 * @param {K8sModel} kindObj - The K8s model for the pod controller resource.
 * @param {K8sPodControllerKind} resource - The specific pod controller resource instance for which to generate actions.
 * @param {PDBActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all appropriate PDB actions based on whether a PDB exists.
 * In case of invalid `actionCreators` returned `actions` are an empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {[Action[], boolean]} A tuple containing the generated actions and a boolean indicating if actions are ready.
 *
 */
export const usePDBActions = (
  kindObj: K8sModel,
  resource: K8sPodControllerKind,
  filterActions?: PDBActionCreator[],
): [Action[], boolean] => {
  const namespace = resource?.metadata?.namespace;
  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

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

  const [pdbResources, loaded] = useK8sWatchResource<PodDisruptionBudgetKind[]>(watchedResource);

  const matchedPDB = React.useMemo(() => {
    if (!loaded) return null;
    return getPDBResource(pdbResources, resource);
  }, [loaded, pdbResources, resource]);

  const factory = React.useMemo(() => {
    if (!loaded || !kindObj || !resource) return {};
    return {
      [PDBActionCreator.AddPDB]: () => ({
        id: 'add-pdb',
        label: i18next.t('console-app~Add PodDisruptionBudget'),
        cta: {
          href: pdbRoute(resource, kindObj),
        },
        accessReview: asAccessReview(kindObj, resource, 'create'),
      }),
      [PDBActionCreator.EditPDB]: () => ({
        id: 'edit-pdb',
        label: i18next.t('console-app~Edit PodDisruptionBudget'),
        cta: {
          href: pdbRoute(resource, kindObj),
        },
        accessReview: asAccessReview(kindObj, resource, 'patch'),
      }),
      [PDBActionCreator.DeletePDB]: () => ({
        id: 'delete-pdb',
        label: i18next.t('console-app~Remove PodDisruptionBudget'),
        insertBefore: 'edit-resource-limits',
        cta: () => {
          deletePDBModal({
            workloadName: resource.metadata.name,
            pdb: matchedPDB,
          });
        },
        accessReview: asAccessReview(kindObj, resource, 'delete'),
      }),
    };
  }, [loaded, kindObj, resource, matchedPDB]);

  const actions = React.useMemo<Action[]>(() => {
    if (!loaded || !kindObj || !resource) return [];

    const isEmpty = _.isEmpty(matchedPDB);

    if (memoizedFilterActions) {
      return memoizedFilterActions
        .filter((actionCreator) => {
          // If no PDB exists, only allow AddPDB
          if (isEmpty) return actionCreator === PDBActionCreator.AddPDB;
          // If PDB exists, allow EditPDB and DeletePDB but not AddPDB
          return actionCreator !== PDBActionCreator.AddPDB;
        })
        .map((creator) => factory[creator]?.())
        .filter(Boolean);
    }

    if (isEmpty) {
      return [factory[PDBActionCreator.AddPDB]()];
    }

    return [factory[PDBActionCreator.EditPDB](), factory[PDBActionCreator.DeletePDB]()];
  }, [loaded, kindObj, resource, matchedPDB, memoizedFilterActions, factory]);

  return [actions, loaded];
};
