import * as React from 'react';
import { useCurrentChannel } from '../../hooks/useCurrentChannel';
import { PackageManifestKind } from '../../types';
import { CapabilityLevel } from './operator-hub-item-details';

export const OperatorCapability: React.FC<OperatorCapabilityProps> = ({ packageManifest }) => {
  const currentChannel = useCurrentChannel(packageManifest);
  const capabilities = currentChannel?.currentCSVDesc?.annotations?.capabilities;

  return capabilities ? <CapabilityLevel capability={capabilities} /> : <>-</>;
};

type OperatorCapabilityProps = {
  packageManifest: PackageManifestKind;
};
