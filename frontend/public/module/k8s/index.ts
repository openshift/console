import { JSONSchema6 } from 'json-schema';
import { BadgeType, NodeAddress } from '@console/shared';
import { EventInvolvedObject } from './event';

export * from './job';
export * from './k8s';
export * from './pods';
export * from './resource';
export * from './service-catalog';
export * from './get-resources';
export * from './k8s-models';
export * from './label-selector';
export * from './cluster-operator';
export * from './cluster-settings';
export * from './template';
export * from './swagger';
export * from './event';

export type OwnerReference = {
  name: string;
  kind: string;
  uid: string;
  apiVersion: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
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
  annotations?: { [key: string]: string };
  clusterName?: string;
  creationTimestamp?: string;
  deletionGracePeriodSeconds?: number;
  deletionTimestamp?: string;
  finalizers?: string[];
  generateName?: string;
  generation?: number;
  labels?: { [key: string]: string };
  managedFields?: any[];
  name?: string;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  resourceVersion?: string;
  selfLink?: string;
  uid?: string;
};

export type PartialObjectMetadata = {
  apiVersion: string;
  kind: string;
  metadata: ObjectMetadata;
};

export enum K8sResourceConditionStatus {
  True = 'True',
  False = 'False',
  Unknown = 'Unknown',
}

export type K8sResourceCondition = {
  type: string;
  status: keyof typeof K8sResourceConditionStatus;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
};

export type MatchExpression =
  | { key: string; operator: 'Exists' | 'DoesNotExist' }
  | { key: string; operator: 'In' | 'NotIn' | 'Equals' | 'NotEquals'; values: string[] };

export type MatchLabels = {
  [key: string]: string;
};

export type Selector = {
  matchLabels?: MatchLabels;
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
  effect: TaintEffect;
  key?: string;
  operator: TolerationOperator;
  tolerationSeconds?: number;
  value?: string;
};

// Properties common to (almost) all Kubernetes resources.
export type K8sResourceCommon = {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMetadata;
};

// Generic, unknown kind. Avoid when possible since it allows any key in spec
// or status, weakening type checking.
export type K8sResourceKind = K8sResourceCommon & {
  spec?: {
    selector?: Selector | MatchLabels;
    [key: string]: any;
  };
  status?: { [key: string]: any };
  type?: { [key: string]: any };
  data?: { [key: string]: any };
};

export type VolumeMount = {
  mountPath: string;
  mountPropagation?: 'None' | 'HostToContainer' | 'Bidirectional';
  name: string;
  readOnly?: boolean;
  subPath?: string;
  subPathExpr?: string;
};

type ProbePort = string | number;

export type ExecProbe = {
  command: string[];
};

export type HTTPGetProbe = {
  path?: string;
  port: ProbePort;
  host?: string;
  scheme: 'HTTP' | 'HTTPS';
  httpHeaders?: any[];
};

export type TCPSocketProbe = {
  port: ProbePort;
  host?: string;
};

export type Handler = {
  exec?: ExecProbe;
  httpGet?: HTTPGetProbe;
  tcpSocket?: TCPSocketProbe;
};

export type ContainerProbe = {
  initialDelaySeconds?: number;
  timeoutSeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
} & Handler;

export type ContainerLifecycleStage = 'postStart' | 'preStop';

export type ContainerLifecycle = {
  postStart?: Handler;
  preStop?: Handler;
};

export type ResourceList = {
  [resourceName: string]: string;
};

type EnvVarSource = {
  fieldRef?: {
    apiVersion?: string;
    fieldPath: string;
  };
  resourceFieldRef?: {
    resource: string;
    containerName?: string;
    divisor?: string;
  };
  configMapKeyRef?: {
    key: string;
    name: string;
  };
  secretKeyRef?: {
    key: string;
    name: string;
  };
};

export type EnvVar = {
  name: string;
  value?: string;
  valueFrom?: EnvVarSource;
};

export type ContainerPort = {
  name?: string;
  containerPort: number;
  protocol: string;
};

export enum ImagePullPolicy {
  Always = 'Always',
  Never = 'Never',
  IfNotPresent = 'IfNotPresent',
}

export type NodeAffinity = {
  preferredDuringSchedulingIgnoredDuringExecution?: {
    preference: Selector;
    weight: number;
  }[];
  requiredDuringSchedulingIgnoredDuringExecution?: {
    nodeSelectorTerms: Selector[];
  };
};

export type PodAffinity = {
  preferredDuringSchedulingIgnoredDuringExecution: {
    podAffinityTerm: {
      labelSelector?: Selector;
      namespaces?: string[];
      topologyKey: string;
    };
    weight?: number;
  }[];
  requiredDuringSchedulingIgnoredDuringExecution: {
    labelSelector?: Selector;
    namespaces?: string[];
    topologyKey: string;
  }[];
};

export type ContainerSpec = {
  name: string;
  volumeMounts?: VolumeMount[];
  env?: EnvVar[];
  livenessProbe?: ContainerProbe;
  readinessProbe?: ContainerProbe;
  lifecycle?: ContainerLifecycle;
  resources?: {
    limits?: ResourceList;
    requested?: ResourceList;
  };
  ports?: ContainerPort[];
  imagePullPolicy?: ImagePullPolicy;
  [key: string]: any;
};

export type Volume = {
  name: string;
  [key: string]: any;
};

export type PodSpec = {
  volumes?: Volume[];
  initContainers?: ContainerSpec[];
  containers: ContainerSpec[];
  restartPolicy?: 'Always' | 'OnFailure' | 'Never';
  terminationGracePeriodSeconds?: number;
  activeDeadlineSeconds?: number;
  nodeSelector?: any;
  serviceAccountName?: string;
  priorityClassName?: string;
  tolerations?: Toleration[];
  nodeName?: string;
  hostname?: string;
  [key: string]: any;
};

// https://github.com/kubernetes/api/blob/release-1.16/core/v1/types.go#L2411-L2432
export type PodPhase = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';

type ContainerStateValue = {
  reason?: string;
  [key: string]: any;
};

export type ContainerState = {
  waiting?: ContainerStateValue;
  running?: ContainerStateValue;
  terminated?: ContainerStateValue;
};

export type ContainerStatus = {
  name: string;
  state?: ContainerState;
  lastState?: ContainerState;
  ready: boolean;
  restartCount: number;
  image: string;
  imageID: string;
  containerID?: string;
};

export type PodCondition = {
  lastProbeTime?: string;
} & K8sResourceCondition;

export type PodStatus = {
  phase: PodPhase;
  conditions?: PodCondition[];
  message?: string;
  reason?: string;
  startTime?: string;
  initContainerStatuses?: ContainerStatus[];
  containerStatuses?: ContainerStatus[];
  [key: string]: any;
};

export type PodTemplate = {
  metadata: ObjectMetadata;
  spec: PodSpec;
};

export type PodKind = {
  status: PodStatus;
} & K8sResourceCommon &
  PodTemplate;

export type DeploymentCondition = {
  lastUpdateTime?: string;
} & K8sResourceCondition;

export type DeploymentKind = {
  spec: {
    minReadySeconds?: number;
    paused?: boolean;
    progressDeadlineSeconds?: number;
    replicas?: number;
    revisionHistoryLimit?: number;
    selector: Selector;
    strategy?: {
      rollingUpdate?: {
        maxSurge: number | string;
        maxUnavailable: number | string;
      };
      type?: string;
    };
    template: PodTemplate;
  };
  status?: {
    availableReplicas?: number;
    collisionCount?: number;
    conditions?: DeploymentCondition[];
    observedGeneration?: number;
    readyReplicas?: number;
    replicas?: number;
    unavailableReplicas?: number;
    updatedReplicas?: number;
  };
} & K8sResourceCommon;

export type StorageClassResourceKind = {
  provisioner: string;
  reclaimPolicy: string;
} & K8sResourceCommon;

export type NodeCondition = {
  lastHeartbeatTime?: string;
} & K8sResourceCondition;

export type NodeKind = {
  spec: {
    taints?: Taint[];
    unschedulable?: boolean;
  };
  status?: {
    conditions?: NodeCondition[];
    images?: {
      names: string[];
      sizeBytes?: number;
    }[];
    phase?: string;
  };
} & K8sResourceCommon;

export type ConfigMapKind = {
  data: { [key: string]: string };
  binaryData: { [key: string]: string };
} & K8sResourceCommon;

export type JobTemplate = {
  metadata: ObjectMetadata;
  spec: {
    activeDeadlineSeconds?: number;
    backoffLimit?: number;
    completions?: number;
    manualSelector?: boolean;
    parallelism?: boolean;
    selector?: Selector;
    template: PodTemplate;
    ttlSecondsAfterFinished?: number;
  };
};

export type JobKind = {
  apiVersion: string;
  kind: string;
  status: {
    active?: number;
    completionTime?: string;
    conditions?: K8sResourceCondition[];
    failed?: number;
    startTime?: string;
    succeeded?: number;
  };
} & JobTemplate;

export type CronJobKind = {
  apiVersion: string;
  kind: string;
  metadata: ObjectMetadata;
  spec: {
    concurrencyPolicy?: string;
    failedJobsHistoryLimit?: number;
    jobTemplate: JobTemplate;
    schedule: string;
    startingDeadlineSeconds?: number;
    successfulJobsHistoryLimit?: number;
    suspend?: boolean;
  };
  status: {
    active?: {
      apiVersion?: string;
      fieldPath?: string;
      kind?: string;
      name?: string;
      namespace?: string;
      resourceVersion?: string;
      uid?: string;
    }[];
    lastScheduleTime?: string;
  };
};

export type CRDVersion = {
  name: string;
  served: boolean;
  storage: boolean;
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
    validation?: {
      // NOTE: Actually a subset of JSONSchema, but using this type for convenience
      openAPIV3Schema: JSONSchema6;
    };
    versions?: CRDVersion[];
  };
  status?: {
    conditions?: K8sResourceCondition[];
  };
} & K8sResourceCommon;

export type RouteTarget = {
  kind: 'Service';
  name: string;
  weight: number;
};

export type RouteTLS = {
  caCertificate?: string;
  certificate?: string;
  destinationCACertificate?: string;
  insecureEdgeTerminationPolicy?: string;
  key?: string;
  termination: string;
};

export type RouteIngress = {
  conditions: K8sResourceCondition[];
  host?: string;
  routerCanonicalHostname?: string;
  routerName?: string;
  wildcardPolicy?: string;
};

export type RouteKind = {
  spec: {
    alternateBackends?: RouteTarget[];
    host?: string;
    path?: string;
    port?: {
      targetPort: number | string;
    };
    subdomain?: string;
    tls?: RouteTLS;
    to: RouteTarget;
    wildcardPolicy?: string;
  };
  status?: {
    ingress: RouteIngress[];
  };
} & K8sResourceCommon;

export type TemplateParameter = {
  name: string;
  value?: string;
  displayName?: string;
  description?: string;
  generate?: string;
  required?: boolean;
};

export type TemplateKind = {
  message?: string;
  objects: any[];
  parameters: TemplateParameter[];
  labels?: any[];
} & K8sResourceCommon;

type TemplateInstanceObject = {
  ref: ObjectReference;
};

export type TemplateInstanceKind = {
  spec: {
    template: TemplateKind;
    secret: {
      name: string;
    };
    requester?: {
      username?: string;
      uid?: string;
      groups?: string[];
      extra?: any;
    };
  };
  status?: {
    conditions: K8sResourceCondition[];
    objects: TemplateInstanceObject[];
  };
} & K8sResourceCommon;

export type MachineAWSPlacement = {
  availabilityZone?: string;
  region?: string;
};

export type MachineSpec = {
  providerSpec: {
    value?: {
      placement?: MachineAWSPlacement;
    };
  };
  versions: {
    kubelet: string;
  };
  [key: string]: any;
};

export type MachineKind = {
  spec: MachineSpec;
  status?: {
    phase?: string;
    addresses: NodeAddress[];
    lastUpdated: string;
    nodeRef: {
      kind: string;
      name: string;
      uid: string;
    };
    providerStatus: {
      kind: string;
      conditions?: K8sResourceCondition[];
      [key: string]: any;
    };
  };
} & K8sResourceCommon;

export type MachineSetKind = {
  spec: {
    replicas: number;
    selector: any;
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
} & K8sResourceCommon;

export type Patch = {
  op: string;
  path: string;
  value?: any;
};

export type RollingUpdate = { maxUnavailable?: number | string; maxSurge?: number | string };
export type DeploymentUpdateStrategy =
  | {
      type: 'Recreate';
    }
  | {
      type: 'RollingUpdate';
      rollingUpdate: RollingUpdate;
    };

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
    strategy: DeploymentUpdateStrategy;
  };
  status?: {
    availableReplicas: number;
    unavailableReplicas: number;
    readyReplicas: number;
    replicas: number;
  };
} & K8sResourceCommon;

export type MachineConfigKind = {
  spec: {
    osImageURL: string;
    config: any;
  };
} & K8sResourceCommon;

export enum MachineConfigPoolConditionType {
  Updated = 'Updated',
  Updating = 'Updating',
  Degraded = 'Degraded',
}

export type MachineConfigPoolCondition = {
  type: keyof typeof MachineConfigPoolConditionType;
} & K8sResourceCondition;

export type MachineConfigPoolStatus = {
  observedGeneration?: number;
  configuration: {
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
  nodeSelector?: Selector;
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

export type ClusterVersionCondition = {
  type: keyof typeof ClusterVersionConditionType;
} & K8sResourceCondition;

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
} & K8sResourceCommon;

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
    conditions?: K8sResourceCondition[];
    versions?: OperandVersion[];
    relatedObjects?: ClusterOperatorObjectReference[];
  };
} & K8sResourceCommon;

export type MappingMethodType = 'claim' | 'lookup' | 'add';

type IdentityProviderType =
  | 'BasicAuth'
  | 'GitHub'
  | 'GitLab'
  | 'Google'
  | 'HTPasswd'
  | 'Keystone'
  | 'LDAP'
  | 'OpenID'
  | 'RequestHeader';

type IdentityProviderConfig = {
  [key: string]: any;
};

export type IdentityProvider = {
  name: string;
  mappingMethod: MappingMethodType;
  type: IdentityProviderType;
  basicAuth?: IdentityProviderConfig;
  github?: IdentityProviderConfig;
  gitlab?: IdentityProviderConfig;
  google?: IdentityProviderConfig;
  htpasswd?: IdentityProviderConfig;
  keystone?: IdentityProviderConfig;
  ldap?: IdentityProviderConfig;
  openID?: IdentityProviderConfig;
  requestHeader?: IdentityProviderConfig;
};

export type OAuthKind = {
  spec: {
    identityProviders?: IdentityProvider[];
    tokenConfig?: {
      accessTokenMaxAgeSeconds: number;
    };
    templates?: {
      login: string;
      providerSelection: string;
      error: string;
    };
  };
} & K8sResourceCommon;

export type K8sVerb =
  | 'create'
  | 'get'
  | 'list'
  | 'update'
  | 'patch'
  | 'delete'
  | 'deletecollection'
  | 'watch';

export type AccessReviewResourceAttributes = {
  group?: string;
  resource?: string;
  subresource?: string;
  verb?: K8sVerb;
  name?: string;
  namespace?: string;
};

export type SelfSubjectAccessReviewKind = {
  apiVersion: string;
  kind: string;
  metadata?: ObjectMetadata;
  spec: {
    resourceAttributes?: AccessReviewResourceAttributes;
  };
  status?: {
    allowed: boolean;
    denied?: boolean;
    reason?: string;
    evaluationError?: string;
  };
};

export type ResourceAccessReviewRequest = {
  apiVersion: string;
  kind: string;
  namespace?: string;
  resourceAPIVersion: string;
  resourceAPIGroup: string;
  resource: string;
  verb: K8sVerb;
};

export type ResourceAccessReviewResponse = {
  namespace?: string;
  users: string[];
  groups: string[];
} & K8sResourceCommon;

export type UserKind = {
  fullName?: string;
  identities: string[];
} & K8sResourceCommon;

export type GroupKind = {
  users: string[];
} & K8sResourceCommon;

export type K8sKind = {
  abbr: string;
  kind: string;
  label: string;
  labelPlural: string;
  plural: string;
  propagationPolicy?: 'Foreground' | 'Background';

  id?: string;
  crd?: boolean;
  apiVersion: string;
  apiGroup?: string;
  namespaced?: boolean;
  selector?: Selector;
  labels?: { [key: string]: string };
  annotations?: { [key: string]: string };
  verbs?: K8sVerb[];
  shortNames?: string[];
  badge?: BadgeType;
  color?: string;

  // Legacy option for supporing plural names in URL paths when `crd: true`.
  // This should not be set for new models, but is needed to avoid breaking
  // existing links as we transition to using the API group in URL paths.
  legacyPluralURL?: boolean;
};

export type Cause = {
  field: string;
  message: string;
  reason: string;
};

export type Status = {
  apiVersion: 'v1';
  kind: 'Status';
  details: {
    causes: Cause[];
    group: string;
    kind: string;
  };
  message: string;
  metadata: any;
  reason: string;
  status: string;
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

export type EventKind = {
  action?: string;
  count?: number;
  type?: string;
  involvedObject: EventInvolvedObject;
  message?: string;
  eventTime?: string;
  lastTimestamp?: string;
  firstTimestamp?: string;
  reason?: string;
  source: {
    component: string;
    host?: string;
  };
  series?: {
    count?: number;
    lastObservedTime?: string;
    state?: string;
  };
} & K8sResourceCommon;
