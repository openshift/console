import { useSearchParams } from 'react-router-dom-v5-compat';
import { PackageManifestKind } from '../types';

/**
 * Returns the currently selected channel based on URL query parameters,
 * falling back to the default channel or the first available channel.
 */
export const useCurrentChannel = (
  packageManifest: PackageManifestKind,
): PackageManifestKind['status']['channels'][number] | undefined => {
  const [searchParams] = useSearchParams();
  const selectedChannel =
    searchParams.get('channel') ||
    packageManifest?.status?.defaultChannel ||
    packageManifest?.status?.channels?.[0]?.name;

  const currentChannel = packageManifest?.status?.channels?.find(
    (ch) => ch.name === selectedChannel,
  );

  return currentChannel;
};
