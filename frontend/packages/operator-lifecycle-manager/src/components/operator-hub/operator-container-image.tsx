import * as React from 'react';
import { useCurrentChannel } from '../../hooks/useCurrentChannel';
import { PackageManifestKind } from '../../types';

export const OperatorContainerImage: React.FC<OperatorContainerImageProps> = ({
  packageManifest,
}) => {
  const currentChannel = useCurrentChannel(packageManifest);
  const containerImage = currentChannel?.currentCSVDesc?.annotations?.containerImage;

  return <>{containerImage || '-'}</>;
};

type OperatorContainerImageProps = {
  packageManifest: PackageManifestKind;
};
