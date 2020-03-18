import { K8sResourceKind } from '@console/internal/module/k8s';
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

export type OperatorHubCSVAnnotations = {
  certifiedLevel?: string;
  healthIndex?: string;
  repository?: string;
  containerImage?: string;
  createdAt?: string;
  support?: string;
  description?: string;
  categories?: string;
  capabilities?: CapabilityLevel;
  'marketplace.openshift.io/action-text'?: string;
  'marketplace.openshift.io/remote-workflow'?: string;
  'marketplace.openshift.io/support-workflow'?: string;
  tags?: string[];
  'operators.openshift.io/infrastructure-features'?: string;
  'operators.openshift.io/valid-subscription'?: string;
};

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
