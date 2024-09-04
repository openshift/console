import * as SemVer from 'semver';
import { getIndexedItems } from './indexeddb';
import { getBundleMetadata } from './metadata';
import {
  ExtensionCatalogItemMetadata,
  FileBasedCatalogSchema,
  FileBasedCatalogBundle,
} from './types';

export const bundleHasProperty = (bundle: FileBasedCatalogBundle, propertyType: string) =>
  (bundle.properties ?? []).some(({ type }) => type === propertyType);

export const getBundleProperty = (bundle: FileBasedCatalogBundle, propertyType: string) =>
  (bundle.properties ?? []).find(({ type }) => type === propertyType)?.value;

const getBundleVersion = (bundle: FileBasedCatalogBundle) => {
  const versionString = getBundleProperty(bundle, FileBasedCatalogSchema.package)?.version || '';
  return SemVer.parse(versionString);
};

export const compareBundleVersions = (
  a: FileBasedCatalogBundle,
  b: FileBasedCatalogBundle,
): number => {
  const aVersion = getBundleVersion(a);
  const bVersion = getBundleVersion(b);
  return SemVer.compare(aVersion, bVersion);
};

export const getBundleMetadataForPackage = async (
  db: IDBDatabase,
  packageName: string,
): Promise<ExtensionCatalogItemMetadata> => {
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
