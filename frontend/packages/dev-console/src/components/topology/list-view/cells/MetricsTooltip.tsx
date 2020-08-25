import * as React from 'react';
import * as _ from 'lodash';
import { truncateMiddle } from '@console/internal/components/utils';
import { isMobile } from '../list-view-utils';
import { Tooltip } from '@patternfly/react-core';

type MetricsTooltipProps = {
  metricLabel: string;
  byPod: {
    formattedValue: string;
    name: string;
    value: number;
  }[];
};

export const MetricsTooltip: React.FC<MetricsTooltipProps> = ({ metricLabel, byPod, children }) => {
  const sortedMetrics = _.orderBy(byPod, ['value', 'name'], ['desc', 'asc']);
  const content: any[] = _.isEmpty(sortedMetrics)
    ? [<React.Fragment key="no-metrics">No {metricLabel} metrics available.</React.Fragment>]
    : _.concat(
        <div className="odc-topology-list-view__metrics-cell__tooltip-title" key="#title">
          {metricLabel} Usage by Pod
        </div>,
        sortedMetrics.map(({ name, formattedValue }) => (
          <div key={name} className="odc-topology-list-view__metrics-cell__metric-tooltip">
            <div className="odc-topology-list-view__metrics-cell__tooltip-name">
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
