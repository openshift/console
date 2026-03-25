import * as _ from 'lodash';
import type {
  CloudCredentialKind,
  InfrastructureKind,
  AuthenticationKind,
  K8sResourceKind,
  ObjectMetadata,
} from '@console/internal/module/k8s';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { DefaultCatalogSource, DefaultClusterCatalog, OperatorSource } from '../../const';
import type { PackageManifestKind } from '../../types';
import {
  CapabilityLevel,
  InfrastructureFeature,
  InstalledState,
  OLMAnnotation,
  ValidSubscriptionValue,
} from './index';

export const defaultPackageSourceMap = {
  [DefaultCatalogSource.RedHatOperators]: OperatorSource.RedHatOperators,
  [DefaultCatalogSource.RedHatMarketPlace]: OperatorSource.RedHatMarketplace,
  [DefaultCatalogSource.CertifiedOperators]: OperatorSource.CertifiedOperators,
  [DefaultCatalogSource.CommunityOperators]: OperatorSource.CommunityOperators,
};

export const defaultClusterCatalogSourceMap = {
  [DefaultClusterCatalog.OpenShiftRedHatOperators]: OperatorSource.RedHatOperators,
  [DefaultClusterCatalog.OpenShiftRedHatMarketPlace]: OperatorSource.RedHatMarketplace,
  [DefaultClusterCatalog.OpenShiftCertifiedOperators]: OperatorSource.CertifiedOperators,
  [DefaultClusterCatalog.OpenShiftCommunityOperators]: OperatorSource.CommunityOperators,
};

export const getPackageSource = (packageManifest: PackageManifestKind): OperatorSource => {
  const { catalogSource, catalogSourceDisplayName } = packageManifest?.status ?? {};
  return defaultPackageSourceMap?.[catalogSource] || catalogSourceDisplayName || catalogSource;
};

export const getClusterCatalogSource = (clusterCatalog?: string): OperatorSource => {
  return defaultClusterCatalogSourceMap?.[clusterCatalog] || OperatorSource.Custom;
};

export const isAWSSTSCluster = (
  cloudcreds: CloudCredentialKind,
  infra: InfrastructureKind,
  auth: AuthenticationKind,
): boolean => {
  return (
    cloudcreds?.spec?.credentialsMode === 'Manual' &&
    infra?.status?.platform === 'AWS' &&
    auth?.spec?.serviceAccountIssuer !== ''
  );
};

export const isAzureWIFCluster = (
  cloudcreds: CloudCredentialKind,
  infra: InfrastructureKind,
  auth: AuthenticationKind,
): boolean => {
  return (
    cloudcreds?.spec?.credentialsMode === 'Manual' &&
    infra?.status?.platform === 'Azure' &&
    auth?.spec?.serviceAccountIssuer !== ''
  );
};

export const isGCPWIFCluster = (
  cloudcreds: CloudCredentialKind,
  infra: InfrastructureKind,
  auth: AuthenticationKind,
): boolean => {
  return (
    cloudcreds?.spec?.credentialsMode === 'Manual' &&
    infra?.status?.platform === 'GCP' &&
    auth?.spec?.serviceAccountIssuer !== ''
  );
};

export const infrastructureFeatureMap = {
  disconnected: InfrastructureFeature.Disconnected,
  Disconnected: InfrastructureFeature.Disconnected,
  Proxy: InfrastructureFeature.ProxyAware,
  ProxyAware: InfrastructureFeature.ProxyAware,
  'proxy-aware': InfrastructureFeature.ProxyAware,
  FipsMode: InfrastructureFeature.FIPSMode,
  fips: InfrastructureFeature.FIPSMode,
  FIPS: InfrastructureFeature.FIPSMode,
  tlsProfiles: InfrastructureFeature.TLSProfiles,
  TLSProfiles: InfrastructureFeature.TLSProfiles,
  tls: InfrastructureFeature.TLSProfiles,
  TLS: InfrastructureFeature.TLSProfiles,
  cnf: InfrastructureFeature.CNF,
  CNF: InfrastructureFeature.CNF,
  cni: InfrastructureFeature.CNI,
  CNI: InfrastructureFeature.CNI,
  csi: InfrastructureFeature.CSI,
  CSI: InfrastructureFeature.CSI,
  sno: InfrastructureFeature.SNO,
  SNO: InfrastructureFeature.SNO,
  tokenAuth: InfrastructureFeature.TokenAuth,
  TokenAuth: InfrastructureFeature.TokenAuth,
  tokenAuthGCP: InfrastructureFeature.TokenAuthGCP,
  TokenAuthGCP: InfrastructureFeature.TokenAuthGCP,
  [OLMAnnotation.Disconnected]: InfrastructureFeature.Disconnected,
  [OLMAnnotation.FIPSCompliant]: InfrastructureFeature.FIPSMode,
  [OLMAnnotation.ProxyAware]: InfrastructureFeature.ProxyAware,
  [OLMAnnotation.CNF]: InfrastructureFeature.CNF,
  [OLMAnnotation.CNI]: InfrastructureFeature.CNI,
  [OLMAnnotation.CSI]: InfrastructureFeature.CSI,
  [OLMAnnotation.TLSProfiles]: InfrastructureFeature.TLSProfiles,
  [OLMAnnotation.TokenAuthAWS]: InfrastructureFeature.TokenAuth,
  [OLMAnnotation.TokenAuthAzure]: InfrastructureFeature.TokenAuth,
  [OLMAnnotation.TokenAuthGCP]: InfrastructureFeature.TokenAuthGCP,
};

// TODO Replace with JSONSchema validation
export const isArrayOfStrings = (value: any): value is string[] =>
  Array.isArray(value) && !value.some((element) => typeof element !== 'string');

// TODO Replace with JSONSchema validation
export const isK8sResource = (value: any): value is K8sResourceKind =>
  Boolean(value?.metadata?.name);

export const getClusterServiceVersionPlugins: AnnotationParser<string[]> = (
  annotations,
  options,
): string[] =>
  parseJSONAnnotation<string[]>(annotations, OLMAnnotation.OperatorPlugins, {
    validate: isArrayOfStrings,
    ...options,
  }) ?? [];

export const getInternalObjects: AnnotationParser<string[]> = (annotations, options) =>
  parseJSONAnnotation<string[]>(annotations, OLMAnnotation.InternalObjects, {
    validate: isArrayOfStrings,
    ...options,
  }) ?? [];

export const getSuggestedNamespaceTemplate: AnnotationParser<K8sResourceKind> = (
  annotations,
  options,
) =>
  parseJSONAnnotation<K8sResourceKind>(annotations, OLMAnnotation.SuggestedNamespaceTemplate, {
    validate: isK8sResource,
    ...options,
  });

export const getInitializationResource: AnnotationParser<K8sResourceKind> = (
  annotations,
  options,
) =>
  parseJSONAnnotation<K8sResourceKind>(annotations, OLMAnnotation.InitializationResource, {
    validate: isK8sResource,
    ...options,
  });

export const getInitializationLink: AnnotationParser<string> = (annotations) =>
  annotations?.[OLMAnnotation.InitializationLink];

const parseValidSubscriptionAnnotation: AnnotationParser<string[]> = (annotations, options) =>
  parseJSONAnnotation<string[]>(annotations, OLMAnnotation.ValidSubscription, {
    validate: isArrayOfStrings,
    ...options,
  }) ?? [];

export const validSubscriptionReducer = (validSubscriptions: string[]): [string[], string[]] => {
  if (!validSubscriptions) {
    return [[], []];
  }
  const validSubscriptionMap = validSubscriptions?.reduce<{ [key: string]: string[] }>(
    (acc, value) => {
      switch (value) {
        case ValidSubscriptionValue.OpenShiftContainerPlatform:
        case ValidSubscriptionValue.OpenShiftPlatformPlus:
          return {
            ...acc,
            [value]: [value],
          };
        case ValidSubscriptionValue.OpenShiftKubernetesEngine:
        case ValidSubscriptionValue.OpenShiftVirtualizationEngine:
          return {
            ...acc,
            [ValidSubscriptionValue.OpenShiftKubernetesEngine]: [
              ValidSubscriptionValue.OpenShiftKubernetesEngine,
            ],
            [ValidSubscriptionValue.OpenShiftVirtualizationEngine]: [
              ValidSubscriptionValue.OpenShiftVirtualizationEngine,
            ],
          };
        default:
          return {
            ...acc,
            [ValidSubscriptionValue.RequiresSeparateSubscription]: [
              ...(acc?.[ValidSubscriptionValue.RequiresSeparateSubscription] ?? []),
              value,
            ],
          };
      }
    },
    {},
  );
  return [_.flatten(Object.values(validSubscriptionMap)), Object.keys(validSubscriptionMap)];
};

export const getValidSubscription: AnnotationParser<[string[], string[]]> = (
  annotations,
  options,
) => validSubscriptionReducer(parseValidSubscriptionAnnotation(annotations, options));

const parseInfrastructureFeaturesAnnotation: AnnotationParser<string[]> = (annotations, options) =>
  parseJSONAnnotation<InfrastructureFeature[]>(annotations, OLMAnnotation.InfrastructureFeatures, {
    validate: isArrayOfStrings,
    ...options,
  }) ?? [];

export const getInfrastructureFeatures: AnnotationParser<
  InfrastructureFeature[],
  GetInfrastructureFeatureOptions
> = (annotations, options) => {
  const { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF, onError } = options ?? {};
  const parsedInfrastructureFeatures = parseInfrastructureFeaturesAnnotation(annotations, {
    onError,
  });
  const azureTokenAuthIsSupported =
    clusterIsAzureWIF && annotations[OLMAnnotation.TokenAuthAzure] === 'true';
  const awsTokenAuthIsSupported =
    clusterIsAWSSTS && annotations[OLMAnnotation.TokenAuthAWS] === 'true';
  const gcpTokenAuthIsSupported =
    clusterIsGCPWIF && annotations[OLMAnnotation.TokenAuthGCP] === 'true';
  return [...parsedInfrastructureFeatures, ...Object.keys(annotations ?? {})].reduce(
    (supportedFeatures, key) => {
      const feature = infrastructureFeatureMap[key];

      if (!feature) {
        return supportedFeatures;
      }

      const featureIsSupported = annotations?.[key] !== 'false';
      const featureIsIncluded = supportedFeatures.includes(feature);
      const includeFeature = () =>
        featureIsIncluded ? supportedFeatures : [...supportedFeatures, feature];
      const excludeFeature = () =>
        featureIsIncluded ? supportedFeatures.filter((v) => v !== feature) : supportedFeatures;

      if (!featureIsSupported) {
        return excludeFeature();
      }

      const resolveTokenAuthFeature = () => {
        const tokenAuthIsSupported = azureTokenAuthIsSupported || awsTokenAuthIsSupported;
        return tokenAuthIsSupported ? includeFeature() : excludeFeature();
      };
      const resolveTokenAuthGCPFeature = () => {
        return gcpTokenAuthIsSupported ? includeFeature() : excludeFeature();
      };

      switch (feature) {
        case InfrastructureFeature.Disconnected:
        case InfrastructureFeature.FIPSMode:
        case InfrastructureFeature.ProxyAware:
        case InfrastructureFeature.CNF:
        case InfrastructureFeature.CNI:
        case InfrastructureFeature.CSI:
        case InfrastructureFeature.TLSProfiles:
        case InfrastructureFeature.SNO:
          return includeFeature();
        case InfrastructureFeature.TokenAuth:
          return resolveTokenAuthFeature();
        case InfrastructureFeature.TokenAuthGCP:
          return resolveTokenAuthGCPFeature();
        default:
          return supportedFeatures;
      }
    },
    [],
  );
};

export const providerSort = (provider: string): string => {
  if (provider.toLowerCase() === 'red hat') {
    return '';
  }
  return provider;
};

export const sourceSort = (source: string): number => {
  switch (source) {
    case OperatorSource.RedHatOperators:
      return 0;
    case OperatorSource.CertifiedOperators:
      return 1;
    case OperatorSource.CommunityOperators:
      return 2;
    case OperatorSource.RedHatMarketplace:
      return 3;
    default:
      return 4;
  }
};

export const installedStateSort = (provider: string): number => {
  switch (provider) {
    case InstalledState.Installed:
      return 0;
    case InstalledState.NotInstalled:
      return 1;
    default:
      return 3;
  }
};

export const capabilityLevelSort = (capability: string): number => {
  switch (capability) {
    case CapabilityLevel.BasicInstall:
      return 0;
    case CapabilityLevel.SeamlessUpgrades:
      return 1;
    case CapabilityLevel.FullLifecycle:
      return 2;
    case CapabilityLevel.DeepInsights:
      return 3;
    default:
      return 5;
  }
};

export const infraFeaturesSort = (infrastructure: string): number => {
  switch (infrastructure) {
    case InfrastructureFeature.Disconnected:
      return 0;
    case InfrastructureFeature.ProxyAware:
      return 1;
    case InfrastructureFeature.FIPSMode:
      return 2;
    case InfrastructureFeature.TokenAuth:
      return 3;
    case InfrastructureFeature.TLSProfiles:
      return 4;
    default:
      return 5;
  }
};

export const validSubscriptionSort = (validSubscription: string): number => {
  switch (validSubscription) {
    case ValidSubscriptionValue.OpenShiftKubernetesEngine:
    case ValidSubscriptionValue.OpenShiftVirtualizationEngine:
      return 0;
    case ValidSubscriptionValue.OpenShiftContainerPlatform:
      return 1;
    case ValidSubscriptionValue.OpenShiftPlatformPlus:
      return 2;
    case ValidSubscriptionValue.RequiresSeparateSubscription:
      return 3;
    default:
      return 4;
  }
};

export const getSupportWorkflowUrl = (marketplaceSupportWorkflow: string): string => {
  if (marketplaceSupportWorkflow) {
    try {
      const url = new URL(marketplaceSupportWorkflow);
      url.searchParams.set('utm_source', 'openshift_console');
      return url.toString();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error while parsing support workflow URL', error.message);
    }
  }
  return '';
};

type AnnotationParserOptions = {
  onError?: (e: any) => void;
};

type GetInfrastructureFeatureOptions = AnnotationParserOptions & {
  clusterIsAWSSTS: boolean;
  clusterIsAzureWIF: boolean;
  clusterIsGCPWIF: boolean;
};

type AnnotationParser<
  Result = any,
  Options extends AnnotationParserOptions = AnnotationParserOptions
> = (annotations: ObjectMetadata['annotations'], options?: Options) => Result;
