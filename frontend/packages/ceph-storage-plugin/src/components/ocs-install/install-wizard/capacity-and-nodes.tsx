import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Label, Text, TextContent } from '@patternfly/react-core';
import { humanizeBinaryBytes } from '@console/internal/components/utils';

export const SelectNodesText: React.FC<SelectNodesTextProps> = React.memo(({ text }) => {
  const { t } = useTranslation();

  return (
    <TextContent>
      <Text>{text}</Text>
      <Text>
        <Trans t={t} ns="ceph-storage-plugin">
          The selected nodes will be labeled with &nbsp;
          <Label color="blue">cluster.ocs.openshift.io/openshift-storage=&quot;&quot;</Label>
          &nbsp;(unless they are already labeled). 3 of the selected nodes will be used for initial
          deployment. The remaining nodes will be used by OpenShift as scheduling targets for OCS
          scaling.
        </Trans>
      </Text>
    </TextContent>
  );
});

type SelectNodesTextProps = { text: string };

export const SelectNodesDetails: React.FC<SelectNodesDetailsProps> = React.memo(
  ({ nodes, cpu, zones, memory }) => {
    const { t } = useTranslation();

    return (
      <TextContent>
        <Text data-test-id="nodes-selected">
          {t('ceph-storage-plugin~{{nodeCount, number}} node', { nodeCount: nodes, count: nodes })}{' '}
          {t('ceph-storage-plugin~selected ({{cpu}} CPU and {{memory}} on ', {
            cpu,
            memory: humanizeBinaryBytes(memory).string,
          })}
          {t('ceph-storage-plugin~{{zoneCount, number}} zone', { zoneCount: zones, count: zones })}
        </Text>
      </TextContent>
    );
  },
);

type SelectNodesDetailsProps = {
  nodes: number;
  cpu: number;
  zones: number;
  memory: number;
};
