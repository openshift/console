import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import { NetworkingOverview } from '@console/internal/components/overview/networking-overview';
import { VMNode } from './types';

type TopologyVmResourcePanelProps = {
  vmNode: VMNode;
};

export const TopologyVmResourcesPanel: React.FC<TopologyVmResourcePanelProps> = observer(
  ({ vmNode }: TopologyVmResourcePanelProps) => {
    const vmData = vmNode.getData();
    const vm = vmData.resource;
    const { pod } = vmData.data.vmStatusBundle;

    return (
      <div className="overview__sidebar-pane-body">
        <PodsOverviewContent obj={vm} pods={pod ? [pod] : []} loaded loadError={null} />
        <NetworkingOverview obj={vm} />
      </div>
    );
  },
);
