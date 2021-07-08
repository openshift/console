import * as React from 'react';
import { DataListCell } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import { formatBytesAsMiB } from '@console/internal/components/utils';
import { getTopologyResourceObject } from '../../../utils/topology-utils';
import { useMetricStats } from '../../../utils/useMetricStats';
import MetricsTooltip from './MetricsTooltip';

import './MemoryCell.scss';

type MemoryCellProps = {
  item: Node;
};

interface MemoryCellComponentProps {
  totalBytes: number;
  memoryByPod: any;
}

const MemoryCellComponent: React.FC<MemoryCellComponentProps> = React.memo(
  ({ totalBytes, memoryByPod }) => (
    <div className="odc-topology-list-view__metrics-cell__detail--memory">
      <MetricsTooltip metricLabel="Memory" byPod={memoryByPod}>
        <span>
          <span className="odc-topology-list-view__metrics-cell__metric-value">
            {formatBytesAsMiB(totalBytes)}
          </span>
          &nbsp;
          <span className="odc-topology-list-view__metrics-cell__metric-unit">MiB</span>
        </span>
      </MetricsTooltip>
    </div>
  ),
);

const MemoryCell: React.FC<MemoryCellProps> = ({ item }) => {
  const resource = getTopologyResourceObject(item.getData());
  const memoryStats = useMetricStats(resource);

  return (
    <DataListCell id={`${item.getId()}_memory`}>
      {!memoryStats || !memoryStats.totalBytes || !memoryStats.totalCores ? null : (
        <MemoryCellComponent
          totalBytes={memoryStats.totalBytes}
          memoryByPod={memoryStats.memoryByPod}
        />
      )}
    </DataListCell>
  );
};

export { MemoryCell, MemoryCellComponent };
