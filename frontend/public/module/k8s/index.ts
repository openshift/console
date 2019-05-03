/* eslint-disable no-undef */

export * from './job';
export * from './k8s';
export * from './node';
export * from './pods';
export * from './resource';
export * from './service-catalog';
export * from './autocomplete';
export * from './get-resources';
export * from './k8s-models';
export * from './label-selector';
export * from './cluster-operator';
export * from './cluster-settings';

export type OwnerReference = {
  name: string;
  kind: string;
  uid: string;
  apiVersion: string;
};

export type ObjectReference = {
  kind?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  apiVersion?: string;
  resourceVersion?: string;
  fieldPath?: string;
};

export type ObjectMetadata = {
  name?: string;
  generateName?: string;
  annotations?: {[key: string]: string},
  namespace?: string,
  labels?: {[key: string]: string},
  ownerReferences?: OwnerReference[],
  [key: string]: any,
};

export enum K8sResourceConditionStatus {
  True = 'True',
  False = 'False',
  Unknown = 'Unknown',
}

export type K8sResourceCondition<T> = {
  type: T;
  status: K8sResourceConditionStatus;
  lastTransitionTime: string;
  reason: string;
  message: string;
};

export type MatchExpression = {key: string, operator: 'Exists' | 'DoesNotExist'} | {key: string, operator: 'In' | 'NotIn' | 'Equals' | 'NotEquals', values: string[]};

export type Selector = {
  matchLabels?: {[key: string]: string};
  matchExpressions?: MatchExpression[];
};

export type TaintEffect = '' | 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';

export type Taint = {
  key: string;
  value: string;
  effect: TaintEffect;
};

export type TolerationOperator = 'Exists' | 'Equal';

export type Toleration = {
  key?: string;
  operator: TolerationOperator;
  value?: string;
  effect: TaintEffect;
};

export type K8sResourceKind = {
  apiVersion: string;
  kind: string;
  metadata: ObjectMetadata;
  spec?: {
    selector?: Selector;
    [key: string]: any
  };
  status?: {[key: string]: any};
  type?: {[key: string]: any};
};

export type NodeKind = {
  spec?: {
    taints?: Taint[];
  };
} & K8sResourceKind;

export type ConfigMapKind = {
  apiVersion: string;
  kind: string;
  metadata: {
    annotations?: {[key: string]: string},
    name: string,
    namespace?: string,
    labels?: {[key: string]: string},
    ownerReferences?: OwnerReference[],
    [key: string]: any,
  };
  data: {[key: string]: string};
};

export type CustomResourceDefinitionKind = {
  spec: {
    version: string;
    group: string;
    names: {
      kind: string;
      singular: string;
      plural: string;
      listKind: string;
      shortNames?: string[];
    };
    scope?: 'Namespaced';
  }
} & K8sResourceKind;

export type MachineSpec = {
  providerSpec: {
    value: K8sResourceKind;
  };
  versions: {
    kubelet: string;
  };
  [key: string]: any;
};

export type MachineKind = {
  spec: MachineSpec;
  status?: {
    addresses: {
      address?: string;
      type: string;
    };
    lastUpdated: string;
    nodeRef: {
      kind: string;
      name: string;
      uid: string;
    };
    providerStatus: {
      kind: string;
      conditions?: any[];
      [key: string]: any;
    };
  };
} & K8sResourceKind;

export type MachineSetKind = {
  spec: {
    replicas: number;
    template: {
      spec: MachineSpec;
    };
  };
  status?: {
    availableReplicas: number;
    fullyLabeledReplicas: number;
    readyReplicas: number;
    replicas: number;
  };
} & K8sResourceKind;

export type MachineDeploymentKind = {
  spec: {
    replicas: number;
    selector: Selector;
    template: {
      spec: MachineSpec;
    };
    paused?: boolean;
    minReadySeconds?: number;
    progressDeadlineSeconds?: number;
    strategy: {
      type: string;
      rollingUpdate?: {
        maxUnavailable?: number | string;
        maxSurge?: number | string;
      };
    };
  };
  status?: {
    availableReplicas: number;
    unavailableReplicas: number;
    readyReplicas: number;
    replicas: number;
  };
} & K8sResourceKind;

export type MachineConfigKind = {
  spec: {
    osImageURL: string;
    config: any;
  };
} & K8sResourceKind;

export enum MachineConfigPoolConditionType {
  Updated = 'Updated',
  Updating = 'Updating',
  Degraded = 'Degraded',
}

export type MachineConfigPoolCondition = K8sResourceCondition<MachineConfigPoolConditionType>;

export type MachineConfigPoolStatus = {
  observedGeneration?: number;
  configuration:{
    name: string;
    source: ObjectReference[];
  };
  machineCount: number;
  updatedMachineCount: number;
  readyMachineCount: number;
  unavailableMachineCount: number;
  conditions: MachineConfigPoolCondition[];
};

export type MachineConfigPoolSpec = {
  machineConfigSelector?: Selector;
  machineSelector?: Selector;
  paused: boolean;
  maxUnavailable: number | string;
};

export type MachineConfigPoolKind = {
  spec: MachineConfigPoolSpec;
  status: MachineConfigPoolStatus;
} & K8sResourceKind;

export type ClusterUpdate = {
  image: string;
  version: string;
};

export type UpdateHistory = {
  state: 'Completed' | 'Partial';
  startedTime: string;
  completionTime: string;
  version: string;
  image: string;
};

export enum ClusterVersionConditionType {
  Available = 'Available',
  Failing = 'Failing',
  Progressing = 'Progressing',
  RetrievedUpdates = 'RetrievedUpdates',
  Invalid = 'Invalid',
}

export type ClusterVersionCondition = K8sResourceCondition<ClusterVersionConditionType>;

type ClusterVersionStatus = {
  availableUpdates: ClusterUpdate[];
  conditions: ClusterVersionCondition[];
  desired: ClusterUpdate;
  history: UpdateHistory[];
};

type ClusterVersionSpec = {
  channel: string;
  clusterID: string;
  desiredUpdate: ClusterUpdate;
  upstream: string;
};

export type ClusterVersionKind = {
  spec: ClusterVersionSpec;
  status: ClusterVersionStatus;
} & K8sResourceKind;

export type OperandVersion = {
  name: string;
  version: string;
};

type ClusterOperatorObjectReference = {
  group: string;
  resource: string;
  namespace?: string;
  name: string;
};

export type ClusterOperator = {
  spec: {};
  status: {
    conditions?: any[];
    versions?: OperandVersion[];
    relatedObjects?: ClusterOperatorObjectReference[];
  };
} & K8sResourceKind;

export type K8sKind = {
  abbr: string;
  kind: string;
  label: string;
  labelPlural: string;
  path: string;
  plural: string;
  propagationPolicy?: 'Foreground' | 'Background';

  id?: string;
  crd?: boolean;
  apiVersion: string;
  apiGroup?: string;
  namespaced?: boolean;
  selector?: Selector;
  labels?: {[key: string]: string};
  annotations?: {[key: string]: string};
  verbs?: string[];
};

export type ContainerPort = {
  containerPort: number,
  protocol: string,
};

/**
 * GroupVersionKind unambiguously identifies a kind.
 * https://godoc.org/k8s.io/apimachinery/pkg/runtime/schema#GroupVersionKind
 * TODO: Change this to a regex-type if it ever becomes a thing (https://github.com/Microsoft/TypeScript/issues/6579)
 */
export type GroupVersionKind = string;

/**
 * The canonical, unique identifier for a Kubernetes resource type.
 * Maintains backwards-compatibility with references using the `kind` string field.
 */
export type K8sResourceKindReference = GroupVersionKind | string;
