import {
  CloudCredentialKind,
  InfrastructureKind,
  AuthenticationKind,
  K8sResourceKind,
  ObjectMetadata,
} from '@console/internal/module/k8s';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { DefaultCatalogSource, PackageSource } from '../../const';
import { PackageManifestKind } from '../../types';
import { InfrastructureFeature, OLMAnnotation, ValidSubscriptionValue } from './index';

export const defaultPackageSourceMap = {
  [DefaultCatalogSource.RedHatOperators]: PackageSource.RedHatOperators,
  [DefaultCatalogSource.RedHatMarketPlace]: PackageSource.RedHatMarketplace,
  [DefaultCatalogSource.CertifiedOperators]: PackageSource.CertifiedOperators,
  [DefaultCatalogSource.CommunityOperators]: PackageSource.CommunityOperators,
};

export const getPackageSource = (packageManifest: PackageManifestKind): PackageSource => {
  const { catalogSource, catalogSourceDisplayName } = packageManifest?.status ?? {};
  return defaultPackageSourceMap?.[catalogSource] || catalogSourceDisplayName || catalogSource;
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
export const normalizeInfrastructureFeature = (feature: string): InfrastructureFeature =>
  infrastructureFeatureMap[feature] ?? feature;

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

const parseValidSubscriptionAnnotation: AnnotationParser<string[]> = (annotations, options) =>
  parseJSONAnnotation<string[]>(annotations, OLMAnnotation.ValidSubscription, {
    validate: isArrayOfStrings,
    ...options,
  }) ?? [];

export const getValidSubscription: AnnotationParser<[string[], ValidSubscriptionValue[]]> = (
  annotations,
  options,
) => {
  const validSubscription = parseValidSubscriptionAnnotation(annotations, options);
  const validSubscriptionFilters = validSubscription.reduce<ValidSubscriptionValue[]>(
    (acc, value) => {
      const filterValue =
        {
          [ValidSubscriptionValue.OpenShiftContainerPlatform]:
            ValidSubscriptionValue.OpenShiftContainerPlatform,
          [ValidSubscriptionValue.OpenShiftKubernetesEngine]:
            ValidSubscriptionValue.OpenShiftKubernetesEngine,
          [ValidSubscriptionValue.OpenShiftPlatformPlus]:
            ValidSubscriptionValue.OpenShiftPlatformPlus,
        }[value] ?? ValidSubscriptionValue.RequiresSeparateSubscription;
      return acc.includes(filterValue) ? acc : [...acc, filterValue];
    },
    [],
  );
  return [validSubscription, validSubscriptionFilters];
};

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
    clusterIsAzureWIF && annotations[OLMAnnotation.TokenAuthAzure] !== 'false';
  const awsTokenAuthIsSupported =
    clusterIsAWSSTS && annotations[OLMAnnotation.TokenAuthAWS] !== 'false';
  return [...parsedInfrastructureFeatures, ...Object.keys(annotations ?? {})].reduce(
    (supportedFeatures, key) => {
      const feature = normalizeInfrastructureFeature(key);

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
        return clusterIsGCPWIF ? includeFeature() : excludeFeature();
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
