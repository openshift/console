import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { PodKind } from '@console/internal/module/k8s';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import { NetworkingOverview } from '@console/internal/components/overview/networking-overview';
import { VMNode } from './types';
import { usePodsForVm } from '../utils/usePodsForVm';

type TopologyVmResourcePanelProps = {
  vmNode: VMNode;
};

export const TopologyVmResourcesPanel: React.FC<TopologyVmResourcePanelProps> = observer(
  ({ vmNode }: TopologyVmResourcePanelProps) => {
    const vmData = vmNode.getData();
    const { obj: vm, services, routes } = vmData?.resources;
    const { loaded, loadError, podData } = usePodsForVm(vm);

    return (
      <div className="overview__sidebar-pane-body">
        <PodsOverviewContent
          obj={vm}
          pods={(podData?.pods ?? []) as PodKind[]}
          loaded={loaded}
          loadError={loadError}
        />
        <NetworkingOverview services={services} routes={routes} />
      </div>
    );
  },
);
