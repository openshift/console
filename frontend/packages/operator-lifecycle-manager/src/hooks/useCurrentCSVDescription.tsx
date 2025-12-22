import { useSearchParams } from 'react-router-dom-v5-compat';
import { CSVDescription, PackageManifestKind } from '../types';

export const useCurrentCSVDescription: UseCurrentCSVDescription = (
  packageManifest,
  selectedChannel?,
) => {
  const [searchParams] = useSearchParams();
  const installChannel =
    selectedChannel ?? searchParams.get('channel') ?? packageManifest?.status?.defaultChannel;
  const currentChannel =
    packageManifest?.status.channels.find((ch) => ch.name === installChannel) ??
    packageManifest?.status.channels[0];
  return currentChannel?.currentCSVDesc;
};

type UseCurrentCSVDescription = (
  packageManifest: PackageManifestKind,
  selectedChannel?: string,
) => CSVDescription;
