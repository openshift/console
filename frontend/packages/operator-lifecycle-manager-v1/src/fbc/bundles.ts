// This file will be removed as part of https://issues.redhat.com//browse/CONSOLE-4668
import * as SemVer from 'semver';
import { getIndexedItems } from '../database/indexeddb';
import { getBundleMetadata } from './metadata';
import { FileBasedCatalogBundle, FileBasedCatalogPropertyType, PackageMetadata } from './types';

export const bundleHasProperty = (bundle: FileBasedCatalogBundle, propertyType: string) =>
  (bundle.properties ?? []).some(({ type }) => type === propertyType);

export const getBundleProperty = <V = any>(
  bundle: FileBasedCatalogBundle,
  propertyType: string,
): V => (bundle.properties ?? []).find(({ type }) => type === propertyType)?.value;

const getBundleVersion = (bundle: FileBasedCatalogBundle): SemVer.SemVer => {
  const versionString =
    getBundleProperty<PackagePropertyValue>(bundle, FileBasedCatalogPropertyType.Package)
      ?.version || '';
  return SemVer.parse(versionString) ?? new SemVer.SemVer('0.0.0');
};

export const compareBundleVersions = (
  a: FileBasedCatalogBundle,
  b: FileBasedCatalogBundle,
): number => {
  const aVersion = getBundleVersion(a);
  const bVersion = getBundleVersion(b);
  return SemVer.compare(bVersion, aVersion);
};

export const getBundleMetadataForPackage = async (
  db: IDBDatabase,
  packageName: string,
): Promise<PackageMetadata> => {
  const bundles = await getIndexedItems<FileBasedCatalogBundle>(
    db,
    'olm.bundle',
    'package',
    packageName,
  ).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn(e);
    return [];
  });
  const [latestBundle] = bundles?.sort?.(compareBundleVersions) ?? [];
  return latestBundle ? getBundleMetadata(latestBundle) : {};
};

type PackagePropertyValue = { version: string };
