import { getIndexedItems } from './indexeddb';
import { ExtensionCatalogItem, FileBasedCatalogChannel } from './types';

export const aggregateChannels = (
  channels: FileBasedCatalogChannel[],
): ExtensionCatalogItem['channels'] =>
  channels.reduce((acc, channel) => {
    const versions = channel.entries.map(({ name }) => name);
    return {
      ...acc,
      [channel.name]: versions,
    };
  }, {});

export const getChannelsForPackage = async (
  db: IDBDatabase,
  pkgName: string,
): Promise<ExtensionCatalogItem['channels']> => {
  const channels = await getIndexedItems<FileBasedCatalogChannel>(
    db,
    'olm.channel',
    'package',
    pkgName,
  ).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn(e);
    return [];
  });
  return aggregateChannels(channels ?? []);
};
