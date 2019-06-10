import { PackageManifestKind, SubscriptionKind } from '../operator-lifecycle-manager';

export enum ProviderType {
  RedHat = 'Red Hat',
  Certified = 'Certified',
  Community = 'Community',
  Custom = 'Custom',
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

export type OperatorHubItem = {
  obj: PackageManifestKind;
  name: string;
  kind: string;
  uid: string;
  installed: boolean;
  installState?: InstalledState;
  subscription?: SubscriptionKind
  provider: ProviderType;
  longDescription: string;
  description: string;
  createdAt: string;
  tags: string[];
  categories: string[];
  catalogSource: string;
  catalogSourceNamespace: string;
  [key: string]: any;
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
};
