import { JSONSchema7 } from 'json-schema';
import { NodeAddress } from '@console/shared';
import {
  ObjectReference,
  ObjectMetadata,
  K8sResourceCommon,
  K8sVerb,
  K8sResourceCondition,
  NodeCondition,
  TaintEffect,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { EventInvolvedObject } from './event';
import { Selector, MatchLabels, K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';

export * from '@console/dynamic-plugin-sdk/src/extensions/console-types';
export * from '@console/dynamic-plugin-sdk/src/api/common-types';

export type PartialObjectMetadata = {
  apiVersion: string;
  kind: string;
  metadata: ObjectMetadata;
};

export type ClusterServiceVersionCondition = {
  phase: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
};

export type TolerationOperator = 'Exists' | 'Equal';

export type Toleration = {
  effect: TaintEffect;
  key?: string;
  operator: TolerationOperator;
  tolerationSeconds?: number;
  value?: string;
};

// Generic, unknown kind. Avoid when possible since it allows any key in spec
// or status, weakening type checking.
export type K8sResourceKind = K8sResourceCommon & {
  spec?: {
    [key: string]: any;
  };
  status?: { [key: string]: any };
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

export type VolumeDevice = {
  devicePath: string;
  name: string;
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

export type EnvVarSource = {
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
  configMapRef?: {
    key?: string;
    name: string;
  };
  secretRef?: {
    key?: string;
    name: string;
  };
  configMapSecretRef?: {
    key?: string;
    name: string;
  };
  serviceAccountRef?: {
    key?: string;
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

export type PodAffinityTerm = {
  labelSelector?: Selector;
  namespaces?: string[];
  topologyKey: string;
};

export type PodAffinity = {
  preferredDuringSchedulingIgnoredDuringExecution: {
    podAffinityTerm: PodAffinityTerm;
    weight?: number;
  }[];
  requiredDuringSchedulingIgnoredDuringExecution: PodAffinityTerm[];
};

export type ContainerSpec = {
  name: string;
  volumeMounts?: VolumeMount[];
  volumeDevices?: VolumeDevice[];
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
type PodPhase = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';

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
  status?: PodStatus;
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

export type DeploymentConfigKind = {
  spec: {
    paused?: boolean;
    replicas?: number;
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
    latestVersion?: number;
  };
} & K8sResourceCommon;

export type ResourceQuotaKind = {
  spec?: {
    hard?: { [key: string]: string };
    scopes?: string[];
    scopeSelector?: {
      matchExpressions?: { scopeName: string; operator: string; values?: string[] }[];
    };
  };
  status?: {
    hard?: { [key: string]: string };
    used?: { [key: string]: string };
  };
} & K8sResourceCommon;

export type ClusterResourceQuotaKind = {
  spec?: {
    selector?: {
      labels?: Selector;
      annotations?: MatchLabels;
    };
    quota?: {
      hard?: { [key: string]: string };
      scopes?: string[];
      scopeSelector?: {
        matchExpressions?: { scopeName: string; operator: string; values?: string[] }[];
      };
    };
  };
  status?: {
    namespaces?: {
      namespace: string;
      status: { used?: { [key: string]: string }; hard?: { [key: string]: string } };
    }[];
    total?: { hard?: { [key: string]: string }; used?: { [key: string]: string } };
  };
} & K8sResourceCommon;

export type AppliedClusterResourceQuotaKind = ClusterResourceQuotaKind;

type CurrentObject = {
  averageUtilization?: number;
  averageValue?: string;
  value?: string;
};

type MetricObject = {
  name: string;
  selector?: Selector;
};

type TargetObjcet = {
  averageUtilization?: number;
  type: string;
  averageValue?: string;
  value?: string;
};

type DescribedObject = {
  apiVersion?: string;
  kind: string;
  name: string;
};
export type HPAMetric = {
  type: 'Object' | 'Pods' | 'Resource' | 'External';
  resource?: {
    name: string;
    target: TargetObjcet;
  };
  external?: {
    metric: MetricObject;
    target: TargetObjcet;
  };
  object?: {
    describedObjec: DescribedObject;
    metric: MetricObject;
    target: TargetObjcet;
  };
  pods?: {
    metric: MetricObject;
    target: TargetObjcet;
  };
};

type HPAScalingPolicy = {
  hpaScalingPolicyType: 'Pods' | 'Percent';
  value: number;
  periodSeconds: number;
};

type HPAScalingRules = {
  stabilizationWindowSeconds?: number;
  selectPolicy?: 'Max' | 'Min' | 'Disabled';
  policies?: HPAScalingPolicy[];
};

type HPACurrentMetrics = {
  type: 'Object' | 'Pods' | 'Resource' | 'External';
  external?: {
    current: CurrentObject;
    metric: MetricObject;
  };
  object?: {
    current: CurrentObject;
    describedObject: DescribedObject;
    metric: MetricObject;
  };
  pods?: {
    current: CurrentObject;
    metric: MetricObject;
  };
  resource?: {
    name: string;
    current: CurrentObject;
  };
};

export type HorizontalPodAutoscalerKind = K8sResourceCommon & {
  spec: {
    scaleTargetRef: {
      apiVersion: string;
      kind: string;
      name: string;
    };
    minReplicas?: number;
    maxReplicas: number;
    metrics?: HPAMetric[];
    behavior?: {
      scaleUp?: HPAScalingRules;
      scaleDown?: HPAScalingRules;
    };
  };
  status?: {
    currentReplicas: number;
    desiredReplicas: number;
    currentMetrics?: HPACurrentMetrics[];
    conditions: NodeCondition[];
    lastScaleTime?: string;
  };
};

export type StorageClassResourceKind = {
  provisioner: string;
  reclaimPolicy: string;
  parameters?: {
    [key: string]: string;
  };
} & K8sResourceCommon;

export type ConfigMapKind = {
  data?: { [key: string]: string };
  binaryData?: { [key: string]: string };
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
  schema: {
    // NOTE: Actually a subset of JSONSchema, but using this type for convenience
    openAPIV3Schema: JSONSchema7;
  };
};

export type CustomResourceDefinitionKind = {
  spec: {
    group: string;
    versions: CRDVersion[];
    names: {
      kind: string;
      singular: string;
      plural: string;
      listKind: string;
      shortNames?: string[];
    };
    scope: 'Cluster' | 'Namespaced';
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
    url?: string;
    conditions?: K8sResourceCondition[];
  };
} & K8sResourceCommon;

export type CloudCredentialKind = {
  spec: {
    credentialsMode: string;
  };
} & K8sResourceCommon;

export type InfrastructureKind = {
  status: {
    platform: string;
  };
} & K8sResourceCommon;

export type AuthenticationKind = {
  spec: {
    serviceAccountIssuer: string;
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
      instanceType?: string;
      vmSize?: string;
      machineType?: string;
      flavor?: string;
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
  Degraded = 'Degraded',
  NodeDegraded = 'NodeDegraded',
  RenderDegraded = 'RenderDegraded',
  Updated = 'Updated',
  Updating = 'Updating',
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
  conditions?: MachineConfigPoolCondition[];
};

export type MachineConfigPoolSpec = {
  machineConfigSelector?: Selector;
  maxUnavailable?: number | string;
  nodeSelector?: Selector;
  paused?: boolean;
};

export type MachineConfigPoolKind = {
  /*
   * spec is required per
   * https://github.com/openshift/machine-config-operator/blob/master/pkg/apis/machineconfiguration.openshift.io/v1/types.go#L228-L229
   * but the API doesn't enforce it
   */
  spec?: MachineConfigPoolSpec;
  status?: MachineConfigPoolStatus;
} & K8sResourceKind;

export type Release = {
  version: string;
  image: string;
  url?: string;
  channels?: string[];
};

export type ConditionalUpdate = {
  release: Release;
  conditions: K8sResourceCondition[];
};

export type UpdateHistory = {
  state: 'Completed' | 'Partial';
  startedTime: string;
  completionTime: string;
  version: string;
  image: string;
  verified: boolean;
};

export enum ClusterVersionConditionType {
  Available = 'Available',
  Failing = 'Failing',
  Progressing = 'Progressing',
  RetrievedUpdates = 'RetrievedUpdates',
  Invalid = 'Invalid',
  Upgradeable = 'Upgradeable',
  ReleaseAccepted = 'ReleaseAccepted',
}

export type ClusterVersionCondition = {
  type: keyof typeof ClusterVersionConditionType;
} & K8sResourceCondition;

type ClusterVersionStatus = {
  desired: Release;
  history: UpdateHistory[];
  observedGeneration: number;
  versionHash: string;
  conditions?: ClusterVersionCondition[];
  availableUpdates: Release[];
  conditionalUpdates?: ConditionalUpdate[];
};

type ClusterVersionSpec = {
  channel: string;
  clusterID: string;
  desiredUpdate?: Release;
  upstream?: string;
};

export type ClusterVersionKind = {
  spec: ClusterVersionSpec;
  status: ClusterVersionStatus;
} & K8sResourceCommon;

export type OperandVersion = {
  name: string;
  version: string;
};

export type ClusterOperatorObjectReference = {
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

export type UserInfo = {
  uid?: string;
  username?: string;
  group?: string[];
  extra?: object;
};

export type UserKind = {
  fullName?: string;
  identities: string[];
} & K8sResourceCommon;

export type GroupKind = {
  users: string[];
} & K8sResourceCommon;

/**
 * @deprecated migrated to new type K8sModel, use K8sModel from dynamic-plugin-sdk over K8sKind
 */
export type K8sKind = K8sModel;

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

export type SecretKind = {
  data?: { [key: string]: string };
  stringData?: { [key: string]: string };
  type?: string;
} & K8sResourceCommon;

export type ServiceAccountKind = {
  automountServiceAccountToken?: boolean;
  imagePullSecrets?: { [key: string]: string };
  secrets?: SecretKind[] | { [key: string]: string };
} & K8sResourceCommon;

export type ListKind<R extends K8sResourceCommon> = K8sResourceCommon & {
  items: R[];
};

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

export type MachineHealthCondition = {
  type: string;
  status: string;
  timeout: string;
};

export type MachineHealthCheckKind = K8sResourceCommon & {
  spec: {
    selector: Selector;
    unhealthyConditions: MachineHealthCondition[];
  };
};

export type VolumeSnapshotKind = K8sResourceCommon & {
  status?: VolumeSnapshotStatus & {
    boundVolumeSnapshotContentName?: string;
  };
  spec: {
    source: {
      persistentVolumeClaimName?: string;
      volumeSnapshotContentName?: string;
    };
    volumeSnapshotClassName: string;
  };
};

export type VolumeSnapshotContentKind = K8sResourceCommon & {
  status: VolumeSnapshotStatus & {
    snapshotHandle?: string;
  };
  spec: {
    volumeSnapshotRef: {
      name: string;
      namespace: string;
    };
    source: {
      volumeHandle?: string;
      snapshotHandle?: string;
    };
    volumeSnapshotClassName: string;
    driver: string;
    deletionPolicy: 'Delete' | 'Retain';
  };
};

export type VolumeSnapshotStatus = {
  readyToUse: boolean;
  restoreSize?: number;
  error?: {
    message: string;
    time: string;
  };
};

export type VolumeSnapshotClassKind = K8sResourceCommon & {
  deletionPolicy: string;
  driver: string;
};

export type PersistentVolumeClaimKind = K8sResourceCommon & {
  spec: {
    accessModes: string[];
    resources: {
      requests: {
        storage: string;
      };
    };
    storageClassName: string;
    volumeMode?: string;
    /* Parameters in a cloned PVC */
    dataSource?: {
      name: string;
      kind: string;
      apiGroup: string;
    };
    /**/
  };
  status?: {
    phase: string;
  };
};

export type NetworkPolicyKind = K8sResourceCommon & {
  spec: {
    podSelector?: Selector;
    ingress?: {
      from?: NetworkPolicyPeer[];
      ports?: NetworkPolicyPort[];
    }[];
    egress?: {
      to?: NetworkPolicyPeer[];
      ports?: NetworkPolicyPort[];
    }[];
    policyTypes?: string[];
  };
};

export type NetworkPolicyPeer = {
  podSelector?: Selector;
  namespaceSelector?: Selector;
  ipBlock?: {
    cidr: string;
    except?: string[];
  };
};

export type NetworkPolicyPort = {
  port?: string | number;
  protocol?: string;
};

export type ConsolePluginKind = K8sResourceCommon & {
  spec: {
    displayName: string;
    backend: {
      service: {
        basePath?: string;
        name: string;
        namespace: string;
        port: number;
      };
      type: 'Service';
    };
    i18n?: {
      loadType: 'Preload' | 'Lazy' | '';
    };
    proxy?: ConsolePluginProxy[];
  };
};

export type ConsolePluginProxy = {
  alias: string;
  authorization?: 'UserToken' | 'None';
  caCertificate?: string;
  endpoint: {
    service: {
      name: string;
      namespace: string;
      port: string;
    };
    type: 'Service';
  };
};

export type K8sPodControllerKind = {
  spec?: {
    replicas?: number;
    template?: PodTemplate;
    jobTemplate?: {
      spec?: {
        template: PodTemplate;
      };
    };
  };
} & K8sResourceCommon;

export type DaemonSetKind = {
  spec: {
    minReadySeconds?: number;
    revisionHistoryLimit?: number;
    selector: Selector;
    template: PodTemplate;
    updateStrategy?: DeploymentUpdateStrategy;
  };
  status?: {
    collisionCount?: number;
    conditions?: DeploymentCondition[];
    currentNumberScheduled: number;
    desiredNumberScheduled: number;
    numberAvailable?: number;
    numberMisscheduled: number;
    numberReady: number;
    numberUnavailable: number;
    observedGeneration: number;
    updatedNumberScheduled: number;
  };
} & K8sResourceCommon;

/**
 * Not a real resource kind. A shared resource kind between resources that control pods.
 * eg. Deployment, Statefulset, ReplicaSet, etc..
 */
export type ReplicationControllerKind = {
  spec?: {
    minReadySeconds?: number;
    replicas?: number;
    selector: Selector;
    template: PodTemplate;
  };
  status?: {
    availableReplicas?: number;
    conditions?: DeploymentCondition[];
    fullyLabeledReplicas?: number;
    observedGeneration?: number;
    readyReplicas?: number;
    replicas: number;
  };
} & K8sResourceCommon;

export type ReplicaSetKind = {} & ReplicationControllerKind;

type EndpointSlice = {
  kind?: string;
  name?: string;
  namespace?: string;
  uid?: string;
};

export type EndpointSliceKind = {
  endpoints?: EndpointSlice[];
} & K8sResourceCommon;
