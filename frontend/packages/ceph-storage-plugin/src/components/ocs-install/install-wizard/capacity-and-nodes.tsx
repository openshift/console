import * as React from 'react';
import { Label, Text, TextContent } from '@patternfly/react-core';
import { pluralize, humanizeBinaryBytes } from '@console/internal/components/utils';

export const SelectNodesText: React.FC<SelectNodesTextProps> = React.memo(({ text }) => (
  <TextContent>
    <Text>{text}</Text>
    <Text>
      The selected nodes will be labeled with &nbsp;
      <Label color="blue">cluster.ocs.openshift.io/openshift-storage=&quot;&quot;</Label>
      &nbsp;(unless they are already labeled). 3 of the selected nodes will be used for initial
      deployment. The remaining nodes will be used by OpenShift as scheduling targets for OCS
      scaling.
    </Text>
  </TextContent>
));

type SelectNodesTextProps = { text: string };

export const SelectNodesDetails: React.FC<SelectNodesDetailsProps> = React.memo(
  ({ nodes, cpu, zones, memory }) => (
    <TextContent>
      <Text data-test-id="nodes-selected">
        {pluralize(nodes, 'node')} selected ({cpu} CPU and {humanizeBinaryBytes(memory).string}
        &nbsp;on&nbsp;
        {pluralize(zones, 'zone')})
      </Text>
    </TextContent>
  ),
);

type SelectNodesDetailsProps = {
  nodes: number;
  cpu: number;
  zones: number;
  memory: number;
};
