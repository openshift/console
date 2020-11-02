import * as React from 'react';
import { Node, observer } from '@patternfly/react-topology';
import { DataListCell } from '@patternfly/react-core';
import {
  CpuCellComponent,
  getTopologyResourceObject,
  MemoryCellComponent,
  TopologyListViewNode,
} from '@console/dev-console/src/components/topology';
import { useOverviewMetrics } from '@console/dev-console/src/utils/useOverviewMetrics';
import { getPodMetricStats } from '@console/dev-console/src/components/topology/list-view/metricStats';
import { usePodsForVm } from '../../utils/usePodsForVm';

interface VmListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const VmListViewNode: React.FC<VmListViewNodeProps> = observer(({ item, ...rest }) => {
  const vm = getTopologyResourceObject(item.getData());
  const metrics = useOverviewMetrics();
  const { podData } = usePodsForVm(vm);

  const metricStats = React.useMemo(() => {
    if (!podData) {
      return null;
    }
    return getPodMetricStats(metrics, podData);
  }, [metrics, podData]);

  const memoryCell = (
    <DataListCell key="memory" id={`${item.getId()}_memory`}>
      {!metricStats || !metricStats.totalBytes || !metricStats.totalCores ? null : (
        <MemoryCellComponent
          totalBytes={metricStats.totalBytes}
          memoryByPod={metricStats.memoryByPod}
        />
      )}
    </DataListCell>
  );
  const cpuCell = (
    <DataListCell key="cpu" id={`${item.getId()}_metrics`}>
      {!metricStats || !metricStats.totalBytes || !metricStats.totalCores ? null : (
        <CpuCellComponent cpuByPod={metricStats.cpuByPod} totalCores={metricStats.totalCores} />
      )}
    </DataListCell>
  );

  // No status cell
  const statusCell = <DataListCell key="status" id={`${item.getId()}_status`} />;

  return (
    <TopologyListViewNode
      item={item}
      memoryCell={memoryCell}
      cpuCell={cpuCell}
      statusCell={statusCell}
      {...rest}
    />
  );
});

export { VmListViewNode };
