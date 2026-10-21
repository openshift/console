import type { FC } from 'react';
import { useCurrentChannel } from '../../hooks/useCurrentChannel';
import type { PackageManifestKind } from '../../types';

export const OperatorContainerImage: FC<OperatorContainerImageProps> = ({ packageManifest }) => {
  const currentChannel = useCurrentChannel(packageManifest);
  const containerImage = currentChannel?.currentCSVDesc?.annotations?.containerImage;

  return <>{containerImage || '-'}</>;
};

type OperatorContainerImageProps = {
  packageManifest: PackageManifestKind;
};
