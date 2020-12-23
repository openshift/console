import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import { NetworkingOverview } from '@console/internal/components/overview/networking-overview';
import { VMNode } from './types';
import { PodKind } from '@console/internal/module/k8s/types';
import { usePodsForVm } from '../utils/usePodsForVm';

type TopologyVmResourcePanelProps = {
  vmNode: VMNode;
};

export const TopologyVmResourcesPanel: React.FC<TopologyVmResourcePanelProps> = observer(
  ({ vmNode }: TopologyVmResourcePanelProps) => {
    const vmData = vmNode.getData();
    const vm = vmData.resource;
    const { podData: { pods = [] } = {} } = usePodsForVm(vm);

    return (
      <div className="overview__sidebar-pane-body">
        <PodsOverviewContent obj={vm} pods={pods as PodKind[]} loaded loadError={null} />
        <NetworkingOverview obj={vm} />
      </div>
    );
  },
);
