import * as React from 'react';
import { Node, observer } from '@patternfly/react-topology';
import { DataListCell } from '@patternfly/react-core';
import {
  CpuCellComponent,
  getTopologyResourceObject,
  MemoryCellComponent,
  StatusCellResourceStatus,
  TopologyListViewNode,
} from '@console/dev-console/src/components/topology';
import { useOverviewMetrics } from '@console/dev-console/src/utils/useOverviewMetrics';
import { getPodMetricStats } from '@console/dev-console/src/components/topology/list-view/metricStats';
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const revisions = React.useMemo(() => [resource], [resource.metadata.uid]);
  const { loaded, pods } = usePodsForRevisions(revisions, resource.metadata.namespace);
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
