import * as React from 'react';
import { observer } from '@console/topology';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import { NetworkingOverview } from '@console/internal/components/overview/networking-overview';
import { VMNode } from './types';

type TopologyVmResourcePanelProps = {
  vmNode: VMNode;
};

export const TopologyVmResourcesPanel: React.FC<TopologyVmResourcePanelProps> = observer(
  ({ vmNode }: TopologyVmResourcePanelProps) => {
    const vmData = vmNode.getData();
    const { obj: vm, pods, services, routes } = vmData?.resources;

    return (
      <div className="overview__sidebar-pane-body">
        <PodsOverview pods={pods} obj={vm} />
        <NetworkingOverview services={services} routes={routes} />
      </div>
    );
  },
);
