import type { FC } from 'react';
import { useMemo } from 'react';
import { DataListCell } from '@patternfly/react-core';
import type { Node } from '@patternfly/react-topology';
import { observer } from '@patternfly/react-topology';
import { getPodMetricStats, getTopologyResourceObject, useOverviewMetrics } from '../../utils';
import { usePodsForVm } from '../../utils/usePodsForVM';
import { CpuCellComponent, MemoryCellComponent } from './cells';
import TopologyListViewNode from './TopologyListViewNode';

interface VMListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const VMListViewNode: FC<VMListViewNodeProps> = observer(({ item, ...rest }) => {
  const vm = getTopologyResourceObject(item.getData());
  const metrics = useOverviewMetrics();
  const { podData } = usePodsForVm(vm);

  const metricStats = useMemo(() => {
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

export default VMListViewNode;
