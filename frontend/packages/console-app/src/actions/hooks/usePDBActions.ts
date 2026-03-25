import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import type { K8sPodControllerKind, K8sModel } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { LazyDeletePDBModalOverlay } from '../../components/pdb/modals';
import type { PodDisruptionBudgetKind } from '../../components/pdb/types';
import { getPDBResource } from '../../components/pdb/utils/get-pdb-resources';
import { PodDisruptionBudgetModel } from '../../models';
import { PDBActionCreator } from './types';

const getPDBFormHref = (resource: K8sPodControllerKind, kindObj: K8sModel): string | undefined => {
  const name = resource?.metadata?.name;
  const namespace = resource?.metadata?.namespace;
  if (!name || !namespace) return undefined;
  return `/k8s/ns/${namespace}/${referenceFor(kindObj)}/form?name=${encodeURIComponent(name)}`;
};

/**
 * A React hook for retrieving actions related to PodDisruptionBudgets (PDB).
 *
 * @param  kindObj - The K8s model for the pod controller resource.
 * @param  resource - The specific pod controller resource instance for which to generate actions.
 * @param [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all appropriate PDB actions based on whether a PDB exists.
 * In case of invalid `actionCreators` returned `actions` are an empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns A tuple containing the generated actions and a boolean indicating if actions are ready.
 *
 */
export const usePDBActions = (
  kindObj: K8sModel,
  resource: K8sPodControllerKind,
  filterActions?: PDBActionCreator[],
): [Action[], boolean] => {
  const namespace = resource?.metadata?.namespace;
  const memoizedFilterActions = useDeepCompareMemoize(filterActions);
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const watchedResource = useMemo(
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

  const matchedPDB = useMemo(() => {
    if (!loaded) return null;
    return getPDBResource(pdbResources, resource);
  }, [loaded, pdbResources, resource]);

  const factory = useMemo(() => {
    if (!loaded || !kindObj || !resource)
      return {} as Record<PDBActionCreator, () => Action | undefined>;
    const href = getPDBFormHref(resource, kindObj);
    return {
      [PDBActionCreator.AddPDB]: () =>
        href &&
        ({
          id: 'add-pdb',
          label: t('console-app~Add PodDisruptionBudget'),
          cta: { href },
          accessReview: asAccessReview(kindObj, resource, 'create'),
        } as Action | undefined),
      [PDBActionCreator.EditPDB]: () =>
        href &&
        ({
          id: 'edit-pdb',
          label: t('console-app~Edit PodDisruptionBudget'),
          cta: { href },
          accessReview: asAccessReview(kindObj, resource, 'patch'),
        } as Action | undefined),
      [PDBActionCreator.DeletePDB]: () => ({
        id: 'delete-pdb',
        label: t('console-app~Remove PodDisruptionBudget'),
        insertBefore: 'edit-resource-limits',
        cta: () =>
          launchModal(LazyDeletePDBModalOverlay, {
            workloadName: resource.metadata.name,
            pdb: matchedPDB,
          }),
        accessReview: asAccessReview(kindObj, resource, 'delete'),
      }),
    };
  }, [loaded, kindObj, resource, matchedPDB, t, launchModal]);

  const actions = useMemo<Action[]>(() => {
    if (!loaded || !kindObj || !resource) return [];

    const isEmpty = _.isEmpty(matchedPDB);

    let result: (Action | undefined)[];

    if (memoizedFilterActions) {
      result = memoizedFilterActions
        .filter((actionCreator) => {
          if (isEmpty) return actionCreator === PDBActionCreator.AddPDB;
          return actionCreator !== PDBActionCreator.AddPDB;
        })
        .map((creator) => factory[creator]?.());
    } else if (isEmpty) {
      result = [factory[PDBActionCreator.AddPDB]()];
    } else {
      result = [factory[PDBActionCreator.EditPDB](), factory[PDBActionCreator.DeletePDB]()];
    }

    return result.filter(Boolean);
  }, [loaded, kindObj, resource, matchedPDB, memoizedFilterActions, factory]);

  return [actions, loaded];
};
