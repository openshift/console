import type { K8sPodControllerKind, PodKind } from '@console/internal/module/k8s';
import { LabelSelector, K8sResourceConditionStatus } from '@console/internal/module/k8s';
import type { PDBCondition, PodDisruptionBudgetKind } from '../types';

export const getPDBResource = (
  pdbResources: PodDisruptionBudgetKind[],
  resource: K8sPodControllerKind | PodKind,
): PodDisruptionBudgetKind =>
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
  return !!disruptionNotAllowedCondition && status?.expectedPods > 0;
};

export const checkPodDisruptionBudgets = (pdbArray: PodDisruptionBudgetKind[]) => {
  let count = 0;
  let name = null;

  pdbArray.forEach((pdb) => {
    const isDisruptionViolatedForPDB = isDisruptionViolated(pdb);
    if (isDisruptionViolatedForPDB) {
      count++;
      if (count === 1) {
        name = pdb.metadata.name;
      }
    }
  });
  return count === 1 ? { count, name } : { count };
};
