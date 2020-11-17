import * as React from 'react';
import * as _ from 'lodash';
import { Node } from '@patternfly/react-topology';
import { DataListCell, Tooltip } from '@patternfly/react-core';
import { formatBytesAsMiB, truncateMiddle } from '@console/internal/components/utils';
import { getTopologyResourceObject } from '../../../utils/topology-utils';
import { useMetricStats } from '../../../utils/useMetricStats';
import { isMobile } from '../list-view-utils';

import './MemoryCell.scss';

type MemoryCellProps = {
  item: Node;
};

type MetricsTooltipProps = {
  metricLabel: string;
  byPod: {
    formattedValue: string;
    name: string;
    value: number;
  }[];
};

const MemoryTooltip: React.FC<MetricsTooltipProps> = ({ metricLabel, byPod, children }) => {
  const sortedMetrics = _.orderBy(byPod, ['value', 'name'], ['desc', 'asc']);
  const content: any[] = _.isEmpty(sortedMetrics)
    ? [<React.Fragment key="no-metrics">No {metricLabel} metrics available.</React.Fragment>]
    : _.concat(
        <div className="odc-topology-list-view__metrics-cell__tooltip-title" key="#title">
          {metricLabel} Usage by Pod
        </div>,
        sortedMetrics.map(({ name, formattedValue }) => (
          <div key={name} className="odc-topology-list-view__metrics-cell__metric-tooltip">
            <div className="odc-topology-list-view__tooltip-name">
              <span className="no-wrap">{truncateMiddle(name)}</span>
            </div>
            <div className="odc-topology-list-view__metrics-cell__metric-tooltip-value">
              {formattedValue}
            </div>
          </div>
        )),
      );

  const keepLines = 6;
  // Don't remove a single line to show a "1 other" message since there's space to show the last pod in that case.
  // Make sure we always remove at least 2 lines if we truncate.
  if (content.length > keepLines + 1) {
    const numRemoved = content.length - keepLines;
    content.splice(
      keepLines,
      numRemoved,
      <div key="#removed-pods">and {numRemoved} other pods</div>,
    );
  }

  // Disable the tooltip on mobile since a touch also opens the sidebar, which
  // immediately covers the tooltip content.
  if (isMobile()) {
    return <>{children}</>;
  }
  return (
    <Tooltip content={content} distance={15}>
      <>{children}</>
    </Tooltip>
  );
};

interface MemoryCellComponentProps {
  totalBytes: number;
  memoryByPod: any;
}

const MemoryCellComponent: React.FC<MemoryCellComponentProps> = React.memo(
  ({ totalBytes, memoryByPod }) => (
    <div className="odc-topology-list-view__metrics-cell__detail--memory">
      <MemoryTooltip metricLabel="Memory" byPod={memoryByPod}>
        <span>
          <span className="odc-topology-list-view__metrics-cell__metric-value">
            {formatBytesAsMiB(totalBytes)}
          </span>
          &nbsp;
          <span className="odc-topology-list-view__metrics-cell__metric-unit">MiB</span>
        </span>
      </MemoryTooltip>
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
