export const deleteDatabase = (dbName): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Database error: ${request.error?.message}`));
    };
  });

export const openDatabase = (dbName: string, version?: number): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('olm.package')) {
        const packageStore = db.createObjectStore('olm.package', { keyPath: 'id' });
        packageStore.createIndex('catalog', 'catalog', { unique: false });
      }
      if (!db.objectStoreNames.contains('olm.channel')) {
        const channelStore = db.createObjectStore('olm.channel', { keyPath: 'id' });
        channelStore.createIndex('package', 'package', { unique: false });
        channelStore.createIndex('catalog', 'catalog', { unique: false });
      }
      if (!db.objectStoreNames.contains('olm.bundle')) {
        const bundleStore = db.createObjectStore('olm.bundle', { keyPath: 'id' });
        bundleStore.createIndex('package', 'package', { unique: false });
        bundleStore.createIndex('catalog', 'catalog', { unique: false });
      }
      if (!db.objectStoreNames.contains('extension-catalog')) {
        const extensionCatalogStore = db.createObjectStore('extension-catalog', {
          keyPath: 'id',
        });
        extensionCatalogStore.createIndex('categories', 'categories', {
          unique: false,
          multiEntry: true,
        });
        extensionCatalogStore.createIndex('keywords', 'keywords', {
          unique: false,
          multiEntry: true,
        });
        extensionCatalogStore.createIndex('infrastructureFeatures', 'infrastructureFeatures', {
          unique: false,
          multiEntry: true,
        });
        extensionCatalogStore.createIndex('validSubscription', 'validSubscription', {
          unique: false,
          multiEntry: true,
        });
        extensionCatalogStore.createIndex('source', 'source', { unique: false });
        extensionCatalogStore.createIndex('provider', 'provider', { unique: false });
        extensionCatalogStore.createIndex('catalog', 'catalog', { unique: false });
        extensionCatalogStore.createIndex('capabilities', 'capabilities', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Database error: ${request.error?.message}`));
    };
  });

export const getObjectStore = (db: IDBDatabase, storeName: string, mode: IDBTransactionMode) => {
  const transaction = db.transaction([storeName], mode);
  return transaction.objectStore(storeName);
};

export const addItem = <Item = any>(
  db: IDBDatabase,
  storeName: string,
  item: Item,
): Promise<IDBValidKey> =>
  new Promise((resolve, reject) => {
    const store = getObjectStore(db, storeName, 'readwrite');
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const putItem = <Item = any>(
  db: IDBDatabase,
  storeName: string,
  item: Item,
): Promise<IDBValidKey> =>
  new Promise((resolve, reject) => {
    const store = getObjectStore(db, storeName, 'readwrite');
    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const getItem = <Item = any>(
  db: IDBDatabase,
  storeName: string,
  key: string,
): Promise<Item> =>
  new Promise((resolve, reject) => {
    const store = getObjectStore(db, storeName, 'readonly');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as Item);
    request.onerror = () => reject(request.error);
  });

export const getItems = <Item = any>(db: IDBDatabase, storeName: string): Promise<Item[]> =>
  new Promise((resolve, reject) => {
    const store = getObjectStore(db, storeName, 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const getIndexedItems = <Item = unknown>(
  db: IDBDatabase,
  storeName: string,
  index: string,
  value: string,
): Promise<Item[]> =>
  new Promise((resolve, reject) => {
    // Start a transaction
    const transaction = db.transaction(storeName, 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const storeIndex = objectStore.index(index);
    const keyRange = IDBKeyRange.only(value);
    const cursorRequest = storeIndex.openCursor(keyRange);

    const objects: Item[] = [];
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        objects.push(cursor.value);
        cursor.continue();
      } else {
        resolve(objects);
      }
    };
    cursorRequest.onerror = () => {
      reject(cursorRequest.error);
    };
  });

export const clearObjectStore = (db: IDBDatabase, name: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const objectStore = getObjectStore(db, name, 'readwrite');
    const request = objectStore.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

export const clearObjectStores = (db: IDBDatabase, ...names: string[]) =>
  Promise.all(names.map((name) => clearObjectStore(db, name)));
