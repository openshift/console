import * as React from 'react';
import { Alert, AlertVariant, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';
import { SNAPSHOT_SUPPORT_URL } from '../../../constants';

const UnsupportedVolumesSnapshotAlert = ({
  unsupportedVolumes,
}: UnsupportedVolumesSnapshotAlertProps) => {
  const { t } = useTranslation();

  if (unsupportedVolumes.length === 0) {
    return null;
  }

  return (
    <StackItem>
      <Alert
        variant={AlertVariant.warning}
        isInline
        title={t('kubevirt-plugin~The following disk will not be included in the snapshot', {
          count: unsupportedVolumes?.length,
        })}
      >
        <Stack hasGutter>
          <StackItem>
            <Stack>
              {unsupportedVolumes?.map((vol) => (
                <StackItem key={vol.name}>
                  <strong>{vol.name}</strong> - {vol.reason}
                </StackItem>
              ))}
            </Stack>
          </StackItem>
          <StackItem>
            {t('kubevirt-plugin~Edit the disk or contact your cluster admin for further details.', {
              count: unsupportedVolumes?.length,
            })}
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

export type UnsupportedVolumesSnapshotAlertProps = {
  unsupportedVolumes: any[];
};

export default UnsupportedVolumesSnapshotAlert;
