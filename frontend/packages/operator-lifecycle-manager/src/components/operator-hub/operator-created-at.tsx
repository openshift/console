import * as React from 'react';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { useCurrentChannel } from '../../hooks/useCurrentChannel';
import { PackageManifestKind } from '../../types';

export const OperatorCreatedAt: React.FC<OperatorCreatedAtProps> = ({ packageManifest }) => {
  const currentChannel = useCurrentChannel(packageManifest);
  const createdAt = currentChannel?.currentCSVDesc?.annotations?.createdAt;

  return createdAt && !Number.isNaN(Date.parse(createdAt)) ? (
    <Timestamp timestamp={createdAt} />
  ) : (
    <>{createdAt || '-'}</>
  );
};

type OperatorCreatedAtProps = {
  packageManifest: PackageManifestKind;
};
