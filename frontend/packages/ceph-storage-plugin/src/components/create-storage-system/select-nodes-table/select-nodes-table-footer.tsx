import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextContent, Text } from '@patternfly/react-core';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { getTotalCpu, getTotalMemory, getAllZone } from '../../../utils/create-storage-system';
import { WizardNodeState } from '../reducer';

export const SelectNodesTableFooter: React.FC<SelectNodesDetailsProps> = React.memo(({ nodes }) => {
  const { t } = useTranslation();

  const totalCpu = getTotalCpu(nodes);
  const totalMemory = getTotalMemory(nodes);
  const zones = getAllZone(nodes);

  return (
    <TextContent>
      <Text data-test-id="nodes-selected">
        {t('ceph-storage-plugin~{{nodeCount, number}} node', {
          nodeCount: nodes.length,
          count: nodes.length,
        })}{' '}
        {t('ceph-storage-plugin~selected ({{cpu}} CPU and {{memory}} on ', {
          cpu: totalCpu,
          memory: humanizeBinaryBytes(totalMemory).string,
        })}
        {t('ceph-storage-plugin~{{zoneCount, number}} zone', {
          zoneCount: zones.size,
          count: zones.size,
        })}
        {')'}
      </Text>
    </TextContent>
  );
});

type SelectNodesDetailsProps = {
  nodes: WizardNodeState[];
};
