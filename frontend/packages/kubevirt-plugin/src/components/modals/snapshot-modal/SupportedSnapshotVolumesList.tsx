import * as React from 'react';
import { ExpandableSection, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const SupportedSnapshotVolumesList = ({ supportedVolumes }: SupportedSnapshotVolumesListProps) => {
  const { t } = useTranslation();

  if (supportedVolumes) {
    return null;
  }

  return (
    <StackItem>
      <ExpandableSection
        toggleText={t('kubevirt-plugin~Disks included in this snapshot ({{count}})', {
          count: supportedVolumes?.length,
        })}
      >
        <Stack>
          {supportedVolumes?.map((vol) => (
            <StackItem key={vol.name}>{vol.name}</StackItem>
          ))}
        </Stack>
      </ExpandableSection>
    </StackItem>
  );
};

export type SupportedSnapshotVolumesListProps = {
  supportedVolumes: any[];
};

export default SupportedSnapshotVolumesList;
