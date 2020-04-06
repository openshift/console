import * as React from 'react';
import { Node } from '@console/topology';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import { NetworkingOverview } from '@console/internal/components/overview/networking-overview';

type TopologyVmResourcePanelProps = {
  vmNode: Node;
};

export const TopologyVmResourcesPanel: React.FC<TopologyVmResourcePanelProps> = ({
  vmNode,
}: TopologyVmResourcePanelProps) => {
  const vmData = vmNode.getData();
  const { obj: vm, pods, services, routes } = vmData?.resources;

  return (
    <div className="overview__sidebar-pane-body">
      <PodsOverview pods={pods} obj={vm} />
      <NetworkingOverview services={services} routes={routes} />
    </div>
  );
};
