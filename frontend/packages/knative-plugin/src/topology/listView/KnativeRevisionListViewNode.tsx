import * as React from 'react';
import { DataListCell } from '@patternfly/react-core';
import { Node, observer } from '@patternfly/react-topology';
import {
  CpuCellComponent,
  MemoryCellComponent,
  StatusCellResourceStatus,
  TopologyListViewNode,
} from '@console/topology/src/components/list-view';
import {
  getTopologyResourceObject,
  useOverviewMetrics,
  getPodMetricStats,
} from '@console/topology/src/utils';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';

interface KnativeRevisionListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const ObservedKnativeRevisionListViewNode: React.FC<KnativeRevisionListViewNodeProps> = ({
  item,
  selectedIds,
  onSelect,
  children,
}) => {
  const resource = getTopologyResourceObject(item.getData());
  const metrics = useOverviewMetrics();
  const { loaded, pods } = usePodsForRevisions(resource.metadata.uid, resource.metadata.namespace);
  const podData = React.useMemo(() => {
    if (!loaded) {
      return null;
    }
    const [current, previous] = pods;
    const isRollingOut = !!current && !!previous;
    return {
      current,
      previous,
      obj: current?.obj || resource,
      isRollingOut,
      pods: [...(current?.pods || []), ...(previous?.pods || [])],
    };
  }, [loaded, pods, resource]);

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

  const statusCell = (
    <DataListCell key="status" id={`${item.getId()}_status`}>
      <div className="odc-topology-list-view__detail--status">
        {podData ? <StatusCellResourceStatus obj={podData.obj} podData={podData} /> : null}
      </div>
    </DataListCell>
  );

  return (
    <TopologyListViewNode
      item={item}
      selectedIds={selectedIds}
      onSelect={onSelect}
      memoryCell={memoryCell}
      cpuCell={cpuCell}
      statusCell={statusCell}
    >
      {children}
    </TopologyListViewNode>
  );
};

const KnativeRevisionListViewNode = observer(ObservedKnativeRevisionListViewNode);
export { KnativeRevisionListViewNode };
