import {
  InfrastructureKind,
  CloudCredentialKind,
  AuthenticationKind,
  K8sResourceKind,
  ObjectMetadata,
} from '@console/internal/module/k8s';
import { PackageManifestKind, SubscriptionKind } from '../../types';

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
  OpenShiftContainerPlatform = 'OpenShift Container Platform',
  OpenShiftPlatformPlus = 'OpenShift Platform Plus',
  RequiresSeparateSubscription = 'Requires separate subscription',
}

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
  CertifiedLevel = 'certifiedLevel',
  HealthIndex = 'healthIndex',
  Repository = 'repository',
  ContainerImage = 'containerImage',
  CreatedAt = 'createdAt',
  Support = 'support',
  Description = 'description',
  Categories = 'categories',
  Capabilitiecs = 'capabilities',
  ActionText = 'marketplace.openshift.io/action-text',
  RemoteWorkflow = 'marketplace.openshift.io/remote-workflow',
  SupportWorkflow = 'marketplace.openshift.io/support-workflow',
  InfrastructureFeatures = 'operators.openshift.io/infrastructure-features',
  ValidSubscription = 'operators.openshift.io/valid-subscription',
  Tags = 'tags',
  Disconnected = 'features.operators.openshift.io/disconnected',
  FIPSCompliant = 'features.operators.openshift.io/fips-compliant',
  ProxyAware = 'features.operators.openshift.io/proxy-aware',
  CNF = 'features.operators.openshift.io/cnf',
  CNI = 'features.operators.openshift.io/cni',
  CSI = 'features.operators.openshift.io/csi',
  TLSProfiles = 'features.operators.openshift.io/tls-profiles',
  TokenAuthAWS = 'features.operators.openshift.io/token-auth-aws',
  TokenAuthAzure = 'features.operators.openshift.io/token-auth-azure',
  TokenAuthGCP = 'features.operators.openshift.io/token-auth-gcp',
  SuggestedNamespaceTemplate = 'operatorframework.io/suggested-namespace-template',
  InitializationResource = 'operatorframework.io/initialization-resource',
  InternalObjects = 'operators.operatorframework.io/internal-objects',
  OperatorPlugins = 'console.openshift.io/plugins',
  OperatorType = 'operators.operatorframework.io/operator-type',
  UninstallMessage = 'operator.openshift.io/uninstall-message',
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
  [OLMAnnotation.Capabilitiecs]?: CapabilityLevel;
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
