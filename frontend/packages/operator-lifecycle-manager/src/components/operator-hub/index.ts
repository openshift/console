import { K8sResourceKind, ObjectMetadata } from '@console/internal/module/k8s';
import { PackageManifestKind, SubscriptionKind } from '../../types';

export enum ProviderType {
  RedHat = 'Red Hat',
  Certified = 'Certified',
  Community = 'Community',
  Custom = 'Custom',
  Marketplace = 'Marketplace',
}

export enum InstalledState {
  Installed = 'Installed',
  NotInstalled = 'Not Installed',
}

export enum CapabilityLevel {
  BasicInstall = 'Basic Install',
  SeamlessUpgrades = 'Seamless Upgrades',
  FullLifecycle = 'Full Lifecycle',
  DeepInsights = 'Deep Insights',
}

export enum InfraFeatures {
  Disconnected = 'Disconnected',
  Proxy = 'Proxy',
  FipsMode = 'FIPS Mode',
}

export type OperatorHubItem = {
  obj: PackageManifestKind;
  name: string;
  kind: string;
  uid: string;
  installed: boolean;
  installState?: InstalledState;
  subscription?: SubscriptionKind;
  provider: ProviderType;
  longDescription: string;
  description: string;
  createdAt?: string;
  tags: string[];
  categories: string[];
  catalogSource: string;
  catalogSourceNamespace: string;
  [key: string]: any;
  validSubscription: string[];
  infraFeatures: InfraFeatures[];
};

export enum OperatorHubCSVAnnotationKey {
  certifiedLevel = 'certifiedLevel',
  healthIndex = 'healthIndex',
  repository = 'repository',
  containerImage = 'containerImage',
  createdAt = 'createdAt',
  support = 'support',
  description = 'description',
  categories = 'categories',
  capabilities = 'capabilities',
  actionText = 'marketplace.openshift.io/actionText',
  remoteWorkflow = 'marketplace.openshift.io/remote-workflow',
  supportWorkflow = 'marketplace.openshift.io/support-workflow',
  infrastructureFeatures = 'operators.openshift.io/infrastructure-features',
  validSubscription = 'operators.openshift.io/valid-subscription',
  tags = 'tags',
}

export type OperatorHubCSVAnnotations = {
  [OperatorHubCSVAnnotationKey.certifiedLevel]?: string;
  [OperatorHubCSVAnnotationKey.healthIndex]?: string;
  [OperatorHubCSVAnnotationKey.repository]?: string;
  [OperatorHubCSVAnnotationKey.containerImage]?: string;
  [OperatorHubCSVAnnotationKey.createdAt]?: string;
  [OperatorHubCSVAnnotationKey.support]?: string;
  [OperatorHubCSVAnnotationKey.description]?: string;
  [OperatorHubCSVAnnotationKey.categories]?: string;
  [OperatorHubCSVAnnotationKey.capabilities]?: CapabilityLevel;
  [OperatorHubCSVAnnotationKey.actionText]?: string;
  [OperatorHubCSVAnnotationKey.remoteWorkflow]?: string;
  [OperatorHubCSVAnnotationKey.supportWorkflow]?: string;
  [OperatorHubCSVAnnotationKey.infrastructureFeatures]?: string;
  [OperatorHubCSVAnnotationKey.validSubscription]?: string;
  [OperatorHubCSVAnnotationKey.tags]?: string[];
} & ObjectMetadata['annotations'];

type OperatorHubSpec = {
  sources?: {
    name: string;
    disabled: boolean;
  }[];
  disableAllDefaultSources?: boolean;
};

type OperatorHubStatus = {
  sources: {
    disabled: boolean;
    name: string;
    status: string;
  }[];
};

export type OperatorHubKind = K8sResourceKind & {
  spec: OperatorHubSpec;
  status: OperatorHubStatus;
};
