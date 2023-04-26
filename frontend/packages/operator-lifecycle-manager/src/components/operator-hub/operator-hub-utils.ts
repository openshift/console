import {
  CloudCredentialKind,
  InfrastructureKind,
  AuthenticationKind,
} from '@console/internal/module/k8s';
import { DefaultCatalogSource, DefaultCatalogSourceDisplayName } from '../../const';
import { PackageManifestKind } from '../../types';

export const defaultCatalogSourceDisplayNameMap = {
  [DefaultCatalogSource.RedHatOperators]: DefaultCatalogSourceDisplayName.RedHatOperators,
  [DefaultCatalogSource.RedHatMarketPlace]: DefaultCatalogSourceDisplayName.RedHatMarketplace,
  [DefaultCatalogSource.CertifiedOperators]: DefaultCatalogSourceDisplayName.CertifiedOperators,
  [DefaultCatalogSource.CommunityOperators]: DefaultCatalogSourceDisplayName.CommunityOperators,
};

export const getCatalogSourceDisplayName = (packageManifest: PackageManifestKind): string => {
  const { catalogSource, catalogSourceDisplayName } = packageManifest.status;
  return (
    defaultCatalogSourceDisplayNameMap?.[catalogSource] || catalogSourceDisplayName || catalogSource
  );
};

export const shortLivedTokenAuth = 'Short-lived token authentication';

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
