import * as React from 'react';
import { Alert, AlertVariant, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';
import { SNAPSHOT_SUPPORT_URL } from '../../../constants';

const NoSupportedVolumesSnapshotAlert = () => {
  const { t } = useTranslation();

  return (
    <StackItem>
      <Alert
        variant={AlertVariant.warning}
        isInline
        title={t('kubevirt-plugin~No disks found to include in the snapshot')}
      >
        <Stack hasGutter>
          <StackItem>
            <p>
              {t(
                'kubevirt-plugin~Only disks with a snapshot-supported storage class defined are included in snapshots. No such disks were found.',
              )}
            </p>

            <p>
              {t(
                'kubevirt-plugin~To take a snapshot you can either edit an existing disk to add a snapshot-supported storage class or add a new disk with a compatible storage class defined. For further details, please contact your cluster admin.',
              )}
            </p>
          </StackItem>
          <StackItem>
            <ExternalLink
              additionalClassName="kv-snapshot-modal__link"
              text={<div>{t('kubevirt-plugin~Learn more about snapshots')}</div>}
              href={SNAPSHOT_SUPPORT_URL}
            />
          </StackItem>
        </Stack>
      </Alert>
    </StackItem>
  );
};

export default NoSupportedVolumesSnapshotAlert;
