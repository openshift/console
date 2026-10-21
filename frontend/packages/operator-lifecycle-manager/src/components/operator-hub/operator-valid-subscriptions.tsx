import type { FC } from 'react';
import { PlainList } from '@console/shared/src';
import { useCurrentChannel } from '../../hooks/useCurrentChannel';
import type { PackageManifestKind } from '../../types';
import { getValidSubscription } from './operator-hub-utils';
import type { CSVAnnotations } from './index';

export const OperatorValidSubscriptions: FC<OperatorValidSubscriptionsProps> = ({
  packageManifest,
}) => {
  const currentChannel = useCurrentChannel(packageManifest);
  const currentCSVAnnotations: CSVAnnotations = currentChannel?.currentCSVDesc?.annotations ?? {};

  const [validSubscription] = getValidSubscription(currentCSVAnnotations, {
    onError: (error) =>
      // eslint-disable-next-line no-console
      console.warn(
        `Error parsing valid subscription from PackageManifest "${packageManifest.metadata.name}":`,
        error,
      ),
  });

  return validSubscription?.length ? <PlainList items={validSubscription} /> : <>-</>;
};

type OperatorValidSubscriptionsProps = {
  packageManifest: PackageManifestKind;
};
