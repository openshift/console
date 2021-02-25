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
