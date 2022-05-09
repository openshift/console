import { K8sResourceCommon, K8sResourceCondition, Selector } from '@console/internal/module/k8s';

type PDBCondition = {
  observedGeneration?: number;
} & K8sResourceCondition;

export type PodDisruptionBudgetKind = {
  spec: {
    maxUnavailable?: number | string;
    minAvailable?: number | string;
    selector: Selector;
  };
  status?: {
    conditions: PDBCondition[];
    currentHealthy: number;
    desiredHealthy: number;
    disruptedPods?: Record<string, any>;
    disruptionsAllowed?: number;
    expectedPods?: number;
    observedGeneration?: number;
  };
} & K8sResourceCommon;
