import type {
  InfrastructureKind,
  CloudCredentialKind,
  AuthenticationKind,
  K8sResourceKind,
  ObjectMetadata,
} from '@console/internal/module/k8s';
import type { PackageManifestKind, SubscriptionKind } from '../../types';

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

export enum InfrastructureFeature {
  Disconnected = 'Disconnected',
  ProxyAware = 'Proxy-aware',
  FIPSMode = 'Designed for FIPS',
  TLSProfiles = 'Configurable TLS ciphers',
  CNF = 'Cloud-Native Network Function',
  CNI = 'Container Network Interface',
  CSI = 'Container Storage Interface',
  SNO = 'Single Node Clusters',
  TokenAuth = 'Short-lived token authentication',
  TokenAuthGCP = 'Auth Token GCP',
}

export enum ValidSubscriptionValue {
  OpenShiftKubernetesEngine = 'OpenShift Kubernetes Engine',
  OpenShiftVirtualizationEngine = 'OpenShift Virtualization Engine',
  OpenShiftContainerPlatform = 'OpenShift Container Platform',
  OpenShiftPlatformPlus = 'OpenShift Platform Plus',
  RequiresSeparateSubscription = 'Requires separate subscription',
}

export type TokenizedAuthProvider = 'AWS' | 'Azure' | 'GCP';

export type OperatorHubItem = {
  authentication: AuthenticationKind;
  catalogSource: string;
  catalogSourceNamespace: string;
  categories: string[];
  cloudCredentials: CloudCredentialKind;
  createdAt?: string;
  description: string;
  infraFeatures: InfrastructureFeature[];
  infrastructure: InfrastructureKind;
  installed: boolean;
  installState?: InstalledState;
  kind: string;
  longDescription: string;
  name: string;
  obj: PackageManifestKind;
  provider: string;
  source?: string;
  subscription?: SubscriptionKind;
  tags: string[];
  uid: string;
  validSubscription: string[];
  [key: string]: any;
};

export enum OLMAnnotation {
  ActionText = 'marketplace.openshift.io/action-text',
  Capabilities = 'capabilities',
  Categories = 'categories',
  CertifiedLevel = 'certifiedLevel',
  CNF = 'features.operators.openshift.io/cnf',
  CNI = 'features.operators.openshift.io/cni',
  ContainerImage = 'containerImage',
  CreatedAt = 'createdAt',
  CSI = 'features.operators.openshift.io/csi',
  Description = 'description',
  Disconnected = 'features.operators.openshift.io/disconnected',
  DisplayName = 'displayName',
  FIPSCompliant = 'features.operators.openshift.io/fips-compliant',
  HealthIndex = 'healthIndex',
  InfrastructureFeatures = 'operators.openshift.io/infrastructure-features',
  InitializationResource = 'operatorframework.io/initialization-resource',
  InitializationLink = 'operatorframework.io/initialization-link',
  InternalObjects = 'operators.operatorframework.io/internal-objects',
  OperatorPlugins = 'console.openshift.io/plugins',
  OperatorType = 'operators.operatorframework.io/operator-type',
  ProxyAware = 'features.operators.openshift.io/proxy-aware',
  RemoteWorkflow = 'marketplace.openshift.io/remote-workflow',
  Repository = 'repository',
  SuggestedNamespaceTemplate = 'operatorframework.io/suggested-namespace-template',
  Support = 'support',
  SupportWorkflow = 'marketplace.openshift.io/support-workflow',
  Tags = 'tags',
  TLSProfiles = 'features.operators.openshift.io/tls-profiles',
  TokenAuthAWS = 'features.operators.openshift.io/token-auth-aws',
  TokenAuthAzure = 'features.operators.openshift.io/token-auth-azure',
  TokenAuthGCP = 'features.operators.openshift.io/token-auth-gcp',
  UninstallMessage = 'operator.openshift.io/uninstall-message',
  ValidSubscription = 'operators.openshift.io/valid-subscription',
}

export enum NormalizedOLMAnnotation {
  ActionText = 'actionText',
  Capabilities = 'capabilities',
  Categories = 'categories',
  CertifiedLevel = 'certifiedLevel',
  CNF = 'cnf',
  CNI = 'cni',
  ContainerImage = 'image',
  CreatedAt = 'createdAt',
  CSI = 'csi',
  Description = 'description',
  Disconnected = 'disconnected',
  DisplayName = 'displayName',
  FIPSCompliant = 'fipsCompliant',
  HealthIndex = 'healthIndex',
  InfrastructureFeatures = 'infrastructureFeatures',
  InitializationResource = 'initializationResource',
  InternalObjects = 'internalObjects',
  OperatorPlugins = 'plugins',
  OperatorType = 'operatorType',
  ProxyAware = 'proxyAware',
  RemoteWorkflow = 'remoteWorkflow',
  Repository = 'repository',
  SuggestedNamespaceTemplate = 'suggestedNamespaceTemplate',
  Support = 'support',
  SupportWorkflow = 'supportWorkflow',
  Tags = 'tags',
  TLSProfiles = 'tlsProfiles',
  TokenAuthAWS = 'tokenAuthAWS',
  TokenAuthAzure = 'tokenAuthAzure',
  TokenAuthGCP = 'tokenAuthGCP',
  UninstallMessage = 'uninstallMessage',
  ValidSubscription = 'validSubscription',
}

export type CSVAnnotations = {
  [OLMAnnotation.CertifiedLevel]?: string;
  [OLMAnnotation.HealthIndex]?: string;
  [OLMAnnotation.Repository]?: string;
  [OLMAnnotation.ContainerImage]?: string;
  [OLMAnnotation.CreatedAt]?: string;
  [OLMAnnotation.Support]?: string;
  [OLMAnnotation.Description]?: string;
  [OLMAnnotation.Categories]?: string;
  [OLMAnnotation.Capabilities]?: CapabilityLevel;
  [OLMAnnotation.ActionText]?: string;
  [OLMAnnotation.RemoteWorkflow]?: string;
  [OLMAnnotation.SupportWorkflow]?: string;
  [OLMAnnotation.InfrastructureFeatures]?: string;
  [OLMAnnotation.ValidSubscription]?: string;
  [OLMAnnotation.Tags]?: string[];
  [OLMAnnotation.Disconnected]?: string;
  [OLMAnnotation.FIPSCompliant]?: string;
  [OLMAnnotation.ProxyAware]?: string;
  [OLMAnnotation.TLSProfiles]?: string;
  [OLMAnnotation.CNF]?: string;
  [OLMAnnotation.CNI]?: string;
  [OLMAnnotation.CSI]?: string;
  [OLMAnnotation.TLSProfiles]?: string;
  [OLMAnnotation.TokenAuthAWS]?: string;
  [OLMAnnotation.TokenAuthAzure]?: string;
  [OLMAnnotation.TokenAuthGCP]?: string;
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
