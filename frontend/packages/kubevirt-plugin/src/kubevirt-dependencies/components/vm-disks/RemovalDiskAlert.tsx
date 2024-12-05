import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';

export const RemovalDiskAlert: React.FC<{
  hotplugDiskNames?: string[];
}> = ({ hotplugDiskNames }) => {
  const { t } = useTranslation();
  const diskList = hotplugDiskNames?.join(', ');
  return (
    hotplugDiskNames?.length > 0 && (
      <Alert
        isInline
        variant={AlertVariant.warning}
        title={t(
          'kubevirt-plugin~The following hot-plugged disks will be removed from the virtual machine',
        )}
      >
        <Trans t={t} ns="kubevirt-plugin">
          <strong>{diskList}</strong>
        </Trans>
      </Alert>
    )
  );
};
