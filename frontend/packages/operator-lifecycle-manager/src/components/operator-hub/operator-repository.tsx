import type { FC } from 'react';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { useCurrentChannel } from '../../hooks/useCurrentChannel';
import type { PackageManifestKind } from '../../types';

export const OperatorRepository: FC<OperatorRepositoryProps> = ({ packageManifest }) => {
  const currentChannel = useCurrentChannel(packageManifest);
  const repository = currentChannel?.currentCSVDesc?.annotations?.repository;

  return repository ? <ExternalLink href={repository} text={repository} /> : <>-</>;
};

type OperatorRepositoryProps = {
  packageManifest: PackageManifestKind;
};
