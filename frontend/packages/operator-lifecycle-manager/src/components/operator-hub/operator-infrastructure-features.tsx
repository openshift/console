import type { FC } from 'react';
import { PlainList } from '@console/shared/src';
import { useCurrentChannel } from '../../hooks/useCurrentChannel';
import type { PackageManifestKind } from '../../types';
import { getInfrastructureFeatures } from './operator-hub-utils';
import type { CSVAnnotations } from './index';

export const OperatorInfrastructureFeatures: FC<OperatorInfrastructureFeaturesProps> = ({
  packageManifest,
  clusterIsAWSSTS,
  clusterIsAzureWIF,
  clusterIsGCPWIF,
}) => {
  const currentChannel = useCurrentChannel(packageManifest);
  const currentCSVAnnotations: CSVAnnotations = currentChannel?.currentCSVDesc?.annotations ?? {};

  const infrastructureFeatures = getInfrastructureFeatures(currentCSVAnnotations, {
    clusterIsAWSSTS,
    clusterIsAzureWIF,
    clusterIsGCPWIF,
    onError: (error) =>
      // eslint-disable-next-line no-console
      console.warn(
        `Error parsing infrastructure features from PackageManifest "${packageManifest.metadata.name}":`,
        error,
      ),
  });

  return infrastructureFeatures?.length ? <PlainList items={infrastructureFeatures} /> : <>-</>;
};

type OperatorInfrastructureFeaturesProps = {
  packageManifest: PackageManifestKind;
  clusterIsAWSSTS: boolean;
  clusterIsAzureWIF: boolean;
  clusterIsGCPWIF: boolean;
};
