import { getQueryArgument } from '@console/internal/components/utils';
import { CSVDescription, PackageManifestKind } from '../types';

export const useCurrentCSVDescription: UseCurrentCSVDescription = (packageManifest) => {
  const installChannel = getQueryArgument('channel') ?? packageManifest?.status?.defaultChannel;
  const currentChannel =
    packageManifest?.status.channels.find((ch) => ch.name === installChannel) ??
    packageManifest?.status.channels[0];
  return currentChannel?.currentCSVDesc;
};

type UseCurrentCSVDescription = (packageManifest: PackageManifestKind) => CSVDescription;
