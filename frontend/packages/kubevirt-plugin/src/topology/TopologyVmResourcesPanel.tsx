import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import { NetworkingOverview } from '@console/internal/components/overview/networking-overview';
import { VMNode } from './types';

type TopologyVmResourcePanelProps = {
  vmNode: VMNode;
};

export const TopologyVmResourcesPanel: React.FC<TopologyVmResourcePanelProps> = observer(
  ({ vmNode }: TopologyVmResourcePanelProps) => {
    const vmData = vmNode.getData();
    const { obj: vm, services, routes } = vmData?.resources;

    return (
      <div className="overview__sidebar-pane-body">
        <PodsOverview obj={vm} />
        <NetworkingOverview services={services} routes={routes} />
      </div>
    );
  },
);
