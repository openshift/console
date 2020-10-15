import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { DataListCell } from '@patternfly/react-core';
import { formatCores } from '@console/internal/components/utils';
import { getTopologyResourceObject } from '../../topology-utils';
import { MetricsTooltip } from './MetricsTooltip';
import { useMetricStats } from '../useMetricStats';

import './MetricsCell.scss';

interface CpuCellComponentProps {
  cpuByPod: any;
  totalCores: number;
}

export const CpuCellComponent: React.FC<CpuCellComponentProps> = React.memo(
  ({ cpuByPod, totalCores }) => (
    <div className="odc-topology-list-view__metrics-cell__detail--cpu">
      <MetricsTooltip metricLabel="CPU" byPod={cpuByPod}>
        <span>
          <span className="odc-topology-list-view__metrics-cell__metric-value">
            {formatCores(totalCores)}
          </span>
          &nbsp;
          <span className="odc-topology-list-view__metrics-cell__metric-unit">cores</span>
        </span>
      </MetricsTooltip>
    </div>
  ),
);

type CpuCellProps = {
  item: Node;
};

export const CpuCell: React.FC<CpuCellProps> = ({ item }) => {
  const resource = getTopologyResourceObject(item.getData());
  const memoryStats = useMetricStats(resource);

  return (
    <DataListCell id={`${item.getId()}_metrics`}>
      {!memoryStats || !memoryStats.totalBytes || !memoryStats.totalCores ? null : (
        <CpuCellComponent cpuByPod={memoryStats.cpuByPod} totalCores={memoryStats.totalCores} />
      )}
    </DataListCell>
  );
};
