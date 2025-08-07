import {
  K8sResourceCommon,
  K8sResourceCondition,
  ObjectMetadata,
  Selector,
} from '@console/internal/module/k8s';

export type PDBCondition = {
  observedGeneration?: number;
} & K8sResourceCondition;

export type PodDisruptionBudgetKind = {
  metadata: Omit<ObjectMetadata, 'namespace'> & {
    namespace: string;
  };
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
} & Omit<K8sResourceCommon, 'metadata'>;
