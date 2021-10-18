import { LabelSelector, K8sPodControllerKind, PodKind } from '@console/internal/module/k8s';
import { PodDisruptionBudgetKind } from '../types';

export const getPDBResource = (
  pdbResources: PodDisruptionBudgetKind[],
  resource: K8sPodControllerKind | PodKind,
): PodDisruptionBudgetKind =>
  pdbResources.find((f) =>
    new LabelSelector(f.spec.selector).matchesLabels(
      resource?.spec?.template?.metadata?.labels || resource?.metadata?.labels || {},
    ),
  );
