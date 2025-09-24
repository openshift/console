import {
  LabelSelector,
  K8sPodControllerKind,
  PodKind,
  K8sResourceConditionStatus,
} from '@console/internal/module/k8s';
import { PDBCondition, PodDisruptionBudgetKind } from '../types';

export const getPDBResource = (
  pdbResources: PodDisruptionBudgetKind[],
  resource: K8sPodControllerKind | PodKind,
): PodDisruptionBudgetKind | undefined =>
  pdbResources.find((f) =>
    new LabelSelector(f.spec.selector).matchesLabels(
      resource?.spec?.template?.metadata?.labels || resource?.metadata?.labels || {},
    ),
  );

export const isDisruptionViolated = (pdb: PodDisruptionBudgetKind): boolean => {
  const { status } = pdb;
  const conditions = status?.conditions;

  const disruptionNotAllowedCondition = conditions?.find(
    (condition: PDBCondition) =>
      condition.type === 'DisruptionAllowed' &&
      condition.status === K8sResourceConditionStatus.False,
  );
  return !!disruptionNotAllowedCondition && (status?.expectedPods ?? 0) > 0;
};

export const checkPodDisruptionBudgets = (pdbArray: PodDisruptionBudgetKind[]) => {
  let count = 0;
  let name: string | null = null;

  pdbArray.forEach((pdb) => {
    const isDisruptionViolatedForPDB = isDisruptionViolated(pdb);
    if (isDisruptionViolatedForPDB) {
      count++;
      if (count === 1) {
        name = pdb.metadata?.name || null;
      }
    }
  });
  return count === 1 ? { count, name } : { count };
};
