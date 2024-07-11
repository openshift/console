import {
  K8sResourceCommon,
  K8sResourceCondition,
  K8sResourceKind,
  ObjectReference,
  Selector,
} from '@console/internal/module/k8s';
import { Descriptor } from './components/descriptors/types';

export enum AppCatalog {
  rhOperators = 'rh-operators',
}

export enum ClusterServiceVersionPhase {
  CSVPhaseNone = '',
  CSVPhasePending = 'Pending',
  CSVPhaseInstallReady = 'InstallReady',
  CSVPhaseInstalling = 'Installing',
  CSVPhaseSucceeded = 'Succeeded',
  CSVPhaseFailed = 'Failed',
  CSVPhaseUnknown = 'Unknown',
  CSVPhaseReplacing = 'Replacing',
  CSVPhaseDeleting = 'Deleting',
}

export enum CSVConditionReason {
  CSVReasonRequirementsUnknown = 'RequirementsUnknown',
  CSVReasonRequirementsNotMet = 'RequirementsNotMet',
  CSVReasonRequirementsMet = 'AllRequirementsMet',
  CSVReasonOwnerConflict = 'OwnerConflict',
  CSVReasonComponentFailed = 'InstallComponentFailed',
  CSVReasonInvalidStrategy = 'InvalidInstallStrategy',
  CSVReasonWaiting = 'InstallWaiting',
  CSVReasonInstallSuccessful = 'InstallSucceeded',
  CSVReasonInstallCheckFailed = 'InstallCheckFailed',
  CSVReasonComponentUnhealthy = 'ComponentUnhealthy',
  CSVReasonBeingReplaced = 'BeingReplaced',
  CSVReasonReplaced = 'Replaced',
  CSVReasonCopied = 'Copied',
}

export enum InstallPlanApproval {
  Automatic = 'Automatic',
  Manual = 'Manual',
}

export enum InstallModeType {
  InstallModeTypeOwnNamespace = 'OwnNamespace',
  InstallModeTypeSingleNamespace = 'SingleNamespace',
  InstallModeTypeMultiNamespace = 'MultiNamespace',
  InstallModeTypeAllNamespaces = 'AllNamespaces',
}

export enum SubscriptionState {
  SubscriptionStateNone = '',
  SubscriptionStateFailed = 'UpgradeFailed',
  SubscriptionStateUpgradeAvailable = 'UpgradeAvailable',
  SubscriptionStateUpgradePending = 'UpgradePending',
  SubscriptionStateAtLatest = 'AtLatestKnown',
}

export enum ClusterServiceVersionStatus {
  Failed = 'Failed',
  OK = 'OK',
  Pending = 'Pending',
  Unknown = 'Unknown',
}

export type CRDDescription = {
  name: string;
  version: string;
  kind: string;
  displayName: string;
  description?: string;
  specDescriptors?: Descriptor[];
  statusDescriptors?: Descriptor[];
  resources?: {
    name?: string;
    version: string;
    kind: string;
  }[];
};

export type APIServiceDefinition = {
  name: string;
  group: string;
  version: string;
  kind: string;
  deploymentName: string;
  containerPort: number;
  displayName: string;
  description?: string;
  specDescriptors?: Descriptor[];
  statusDescriptors?: Descriptor[];
  resources?: {
    name?: string;
    version: string;
    kind: string;
  }[];
};

export type ProvidedAPI = CRDDescription | APIServiceDefinition;

export type RequirementStatus = {
  group: string;
  version: string;
  kind: string;
  name: string;
  status: string;
  uuid?: string;
};

export type ClusterServiceVersionIcon = { base64data: string; mediatype: string };

export type ClusterServiceVersionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1';
  kind: 'ClusterServiceVersion';
  spec: {
    install: {
      strategy: 'Deployment';
      spec?: {
        permissions: {
          serviceAccountName: string;
          rules: { apiGroups: string[]; resources: string[]; verbs: string[] }[];
        }[];
        deployments: { name: string; spec: any }[];
      };
    };
    customresourcedefinitions?: { owned?: CRDDescription[]; required?: CRDDescription[] };
    apiservicedefinitions?: { owned?: APIServiceDefinition[]; required?: APIServiceDefinition[] };
    replaces?: string;
    installModes?: { type: InstallModeType; supported: boolean }[];
    displayName?: string;
    description?: string;
    provider?: { name: string };
    version?: string;
    icon?: ClusterServiceVersionIcon[];
  };
  status?: {
    phase: ClusterServiceVersionPhase;
    reason: CSVConditionReason;
    message?: string;
    requirementStatus?: RequirementStatus[];
  };
} & K8sResourceKind;

export type StepResource = {
  group: string;
  version: string;
  kind: string;
  name: string;
  manifest?: string;
  sourceName?: string;
  sourceNamespace?: string;
};

export type Step = {
  resolving: string;
  resource: StepResource;
  status: 'Unknown' | 'NotPresent' | 'Present' | 'Created';
};

export enum InstallPlanPhase {
  InstallPlanPhaseNone = '',
  InstallPlanPhasePlanning = 'Planning',
  InstallPlanPhaseRequiresApproval = 'RequiresApproval',
  InstallPlanPhaseInstalling = 'Installing',
  InstallPlanPhaseComplete = 'Complete',
  InstallPlanPhaseFailed = 'Failed',
}

export type InstallPlanKind = {
  spec: {
    clusterServiceVersionNames: string[];
    approval: InstallPlanApproval;
    approved?: boolean;
  };
  status?: {
    phase: InstallPlanPhase;
    catalogSources: string[];
    plan: Step[];
    conditions?: K8sResourceCondition[];
  };
} & K8sResourceCommon;

export type Env = {
  name: string;
  value: string;
};

export type SubscriptionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1';
  kind: 'Subscription';
  spec: {
    source: string;
    name: string;
    channel?: string;
    startingCSV?: string;
    sourceNamespace?: string;
    installPlanApproval?: InstallPlanApproval;
    config?: {
      env?: Env[];
    };
  };
  status?: {
    catalogHealth?: {
      catalogSourceRef?: ObjectReference;
      healthy?: boolean;
      lastUpdated?: string;
    }[];
    conditions?: K8sResourceCondition[];
    installedCSV?: string;
    installPlanRef?: ObjectReference;
    state?: SubscriptionState;
    lastUpdated?: string;
    currentCSV?: string;
  };
} & K8sResourceCommon;

export type CatalogSourceKind = {
  apiVersion: 'operators.coreos.com/v1alpha1';
  kind: 'CatalogSource';
  spec: {
    name: string;
    sourceType: 'internal' | 'grpc' | 'configMap';
    configMap?: string;
    secrets?: string[];
    displayName?: string;
    description?: string;
    publisher?: string;
    icon?: { mediatype: string; data: string };
    updateStrategy?: { registryPoll: { interval: string } };
  };
} & K8sResourceKind;

export type PackageManifestKind = {
  apiVersion: 'packages.operators.coreos.com/v1';
  kind: 'PackageManifest';
  spec: {};
  status: {
    catalogSource: string;
    catalogSourceNamespace: string;
    catalogSourceDisplayName: string;
    catalogSourcePublisher: string;
    provider: {
      name: string;
    };
    packageName: string;
    deprecation?: { message: string };
    channels: {
      name: string;
      currentCSV: string;
      deprecation?: { message: string };
      currentCSVDesc: {
        annotations?: any;
        description?: string;
        displayName: string;
        icon: { mediatype: string; base64data: string }[];
        keywords?: string[];
        version: string;
        provider: {
          name: string;
        };
        installModes: { type: InstallModeType; supported: boolean }[];
        customresourcedefinitions?: { owned?: CRDDescription[]; required?: CRDDescription[] };
        apiservicedefinitions?: {
          owned?: APIServiceDefinition[];
          required?: APIServiceDefinition[];
        };
      };
      entries?: {
        name: string;
        version: string;
        deprecation?: { message: string };
      }[];
    }[];
    defaultChannel: string;
  };
} & K8sResourceKind;

export type OperatorGroupKind = {
  apiVersion: 'operators.coreos.com/v1';
  kind: 'OperatorGroup';
  spec?: {
    selector?: Selector;
    targetNamespaces?: string[];
    serviceAccount?: K8sResourceKind;
  };
  status?: {
    namespaces?: string[];
    lastUpdated: string;
  };
} & K8sResourceKind;

export type DeprecatedOperatorWarning = {
  deprecation?: {
    message: string;
  };
};
