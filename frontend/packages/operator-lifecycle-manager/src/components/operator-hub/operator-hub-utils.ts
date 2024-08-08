import {
  CloudCredentialKind,
  InfrastructureKind,
  AuthenticationKind,
} from '@console/internal/module/k8s';
import { DefaultCatalogSource, PackageSource } from '../../const';
import { PackageManifestKind } from '../../types';
import { InfraFeatures, OperatorHubCSVAnnotationKey } from '.';

export const defaultPackageSourceMap = {
  [DefaultCatalogSource.RedHatOperators]: PackageSource.RedHatOperators,
  [DefaultCatalogSource.RedHatMarketPlace]: PackageSource.RedHatMarketplace,
  [DefaultCatalogSource.CertifiedOperators]: PackageSource.CertifiedOperators,
  [DefaultCatalogSource.CommunityOperators]: PackageSource.CommunityOperators,
};

export const getPackageSource = (packageManifest: PackageManifestKind): string => {
  const { catalogSource, catalogSourceDisplayName } = packageManifest?.status ?? {};
  return defaultPackageSourceMap?.[catalogSource] || catalogSourceDisplayName || catalogSource;
};

export const isAWSSTSCluster = (
  cloudcreds: CloudCredentialKind,
  infra: InfrastructureKind,
  auth: AuthenticationKind,
) => {
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
) => {
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
) => {
  return (
    cloudcreds?.spec?.credentialsMode === 'Manual' &&
    infra?.status?.platform === 'GCP' &&
    auth?.spec?.serviceAccountIssuer !== ''
  );
};

export const normalizedInfrastructureFeatures = {
  disconnected: InfraFeatures.disconnected,
  Disconnected: InfraFeatures.disconnected,
  Proxy: InfraFeatures['proxy-aware'],
  'proxy-aware': InfraFeatures.proxyAware,
  FipsMode: InfraFeatures.fipsMode,
  fips: InfraFeatures.fipsMode,
  tlsProfiles: InfraFeatures.tlsProfiles,
  cnf: InfraFeatures.cnf,
  cni: InfraFeatures.cni,
  csi: InfraFeatures.csi,
  sno: InfraFeatures.sno,
  TokenAuth: InfraFeatures.tokenAuth,
  tokenAuthGCP: InfraFeatures.tokenAuthGCP,
  [OperatorHubCSVAnnotationKey.disconnected]: InfraFeatures.disconnected,
  [OperatorHubCSVAnnotationKey.fipsCompliant]: InfraFeatures.fipsMode,
  [OperatorHubCSVAnnotationKey.proxyAware]: InfraFeatures.proxyAware,
  [OperatorHubCSVAnnotationKey.cnf]: InfraFeatures.cnf,
  [OperatorHubCSVAnnotationKey.cni]: InfraFeatures.cni,
  [OperatorHubCSVAnnotationKey.csi]: InfraFeatures.csi,
  [OperatorHubCSVAnnotationKey.tlsProfiles]: InfraFeatures.tlsProfiles,
  [OperatorHubCSVAnnotationKey.tokenAuthAWS]: InfraFeatures.tokenAuth,
  [OperatorHubCSVAnnotationKey.tokenAuthAzure]: InfraFeatures.tokenAuth,
  [OperatorHubCSVAnnotationKey.tokenAuthGCP]: InfraFeatures.tokenAuthGCP,
};
