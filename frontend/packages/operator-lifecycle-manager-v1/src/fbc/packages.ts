// This file will be removed as part of https://issues.redhat.com//browse/CONSOLE-4668
/* eslint-disable no-console */
import { defaultClusterCatalogSourceMap } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-utils';
import { PackageSource } from '@console/operator-lifecycle-manager/src/const';
import { putItem } from '../database/indexeddb';
import { ExtensionCatalogItem, FileBasedCatalogPackage } from '../database/types';
import { getBundleMetadataForPackage } from './bundles';
import { getChannelsForPackage } from './channels';

const addPackageToExtensionCatalog = async (
  db: IDBDatabase,
  { id, icon, name, catalog }: FileBasedCatalogPackage,
): Promise<ExtensionCatalogItem> => {
  const channels = await getChannelsForPackage(db, id);
  const metadata = await getBundleMetadataForPackage(db, id);
  const extensionCatalogItem: ExtensionCatalogItem = {
    catalog,
    id,
    icon,
    name,
    source: defaultClusterCatalogSourceMap[catalog] || PackageSource.Custom,
    channels: {
      ...channels,
    },
    ...metadata,
  };
  // eslint-disable-next-line no-console
  await putItem(db, 'extension-catalog', extensionCatalogItem);
  return extensionCatalogItem;
};

export const addPackagesToExtensionCatalog = (
  db: IDBDatabase,
  packages: FileBasedCatalogPackage[],
): Promise<PromiseSettledResult<ExtensionCatalogItem>[]> =>
  Promise.allSettled(
    packages.map((pkg) =>
      addPackageToExtensionCatalog(db, pkg).catch((e) => {
        console.warn(
          '[Extension Catalog Database] Error encountered while creating extension catalog item for',
          pkg.name,
          e.toString(),
        );
        throw e;
      }),
    ),
  );
