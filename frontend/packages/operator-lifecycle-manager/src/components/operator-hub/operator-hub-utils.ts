import {
  CloudCredentialKind,
  InfrastructureKind,
  AuthenticationKind,
} from '@console/internal/module/k8s';
import { DefaultCatalogSource, PackageSource } from '../../const';
import { PackageManifestKind } from '../../types';

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
