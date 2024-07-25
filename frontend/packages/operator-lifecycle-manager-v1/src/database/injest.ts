/* eslint-disable no-console */
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/lib-core';
import { bundleHasProperty } from './bundles';
import { putItem, getItems, clearObjectStores } from './indexeddb';
import { fetchAndProcessJSONLines } from './jsonl';
import { addPackagesToExtensionCatalog } from './packages';
import { isFileBasedCatalogBundle } from './type-guards';
import { FileBasedCatalogItem, FileBasedCatalogSchema } from './types';

const populateExtensionCatalogs = async (db: IDBDatabase): Promise<number> => {
  const packages = await getItems(db, 'olm.package');
  return addPackagesToExtensionCatalog(db, packages).then((results) =>
    results.reduce((acc, r) => (r.status === 'fulfilled' && r.value ? acc + 1 : acc), 0),
  );
};

const streamFBCObjectsToIndexedDB = (
  db: IDBDatabase,
  catalog: string,
  reader: ReadableStreamDefaultReader<FileBasedCatalogItem>,
  count?: number,
): Promise<number> =>
  reader.read().then(async ({ done, value }) => {
    if (done) {
      return count;
    }
    if (
      isFileBasedCatalogBundle(value) &&
      !bundleHasProperty(value, FileBasedCatalogSchema.csvMetadata)
    ) {
      return streamFBCObjectsToIndexedDB(db, catalog, reader, count ?? 0);
    }
    const { schema, ...object } = value;
    const packageName = object.package ?? object.name;
    const objectName = schema === 'olm.package' ? '' : `~${object.name}`;
    const pkg = `${catalog}~${packageName}`; // Fully qualified package includes catalog
    const id = `${pkg}${objectName}`; // catalog~package or catalog~package~object
    await putItem(db, schema, { ...object, id, catalog, package: pkg });
    return streamFBCObjectsToIndexedDB(db, catalog, reader, (count ?? 0) + 1);
  });

const injestClusterCatalog = async (
  db: IDBDatabase,
  catalog: K8sResourceCommon,
): Promise<number> => {
  const catalogName = catalog.metadata.name;
  console.log('[Extension Catalog Database] Injesting FBC from ClusterCatalog', catalogName);
  return fetchAndProcessJSONLines<FileBasedCatalogItem>(
    `/api/catalogd/catalogs/${catalogName}/all.json`,
    { 'Content-Type': 'application/jsonl' },
  )
    .then((reader) => streamFBCObjectsToIndexedDB(db, catalogName, reader))
    .then((count) => {
      console.log(
        '[Extension Catalog Database] Successfully injested',
        count,
        'objects from ClusterCatalog',
        catalogName,
      );
      return count;
    })
    .catch((e) => {
      console.warn(
        '[Extension Catalog Database} Failed to injest FBC from ClusterCatalog',
        catalogName,
        e.toString(),
      );
      return 0;
    });
};

export const populateExtensionCatalogDatabase = async (
  db: IDBDatabase,
  catalogs: K8sResourceCommon[],
): Promise<void> => {
  console.time('[Extension Catalog Database] took');
  console.log('[Extension Catalog Database] Refreshing extension catalog database');
  return clearObjectStores(db, 'olm.package', 'olm.channel', 'olm.bundle', 'extension-catalog')
    .then(() => {
      console.log('[Extension Catalog Database] Object stores cleared');
      return Promise.allSettled(catalogs.map((catalog) => injestClusterCatalog(db, catalog)));
    })
    .then((results) => {
      const fbcObjectCount = results.reduce(
        (acc, result) => (result.status === 'fulfilled' ? acc + result.value : acc),
        0,
      );
      console.log(
        '[Extension Catalog Database]',
        fbcObjectCount,
        'items populated to FBC object stores',
      );
      return populateExtensionCatalogs(db);
    })
    .then((extensionItemCount) => {
      console.log(
        '[Extension Catalog Database] Database initialization complete.',
        extensionItemCount,
        'items populated to extension catlog object store',
      );
      console.timeEnd('[Extension Catalog Database] took');
    })
    .catch((e) => {
      console.warn('[Extension Catalog Database] Error encountered', e.toString());
      console.timeEnd('[Extension Catalog Database] took');
      throw new Error(e);
    });
};
