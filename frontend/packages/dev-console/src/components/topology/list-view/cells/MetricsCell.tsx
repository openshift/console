import * as React from 'react';
import * as _ from 'lodash';
import { Node } from '@patternfly/react-topology';
import { DataListCell, Tooltip } from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { formatBytesAsMiB, formatCores, truncateMiddle } from '@console/internal/components/utils';
import { useOverviewMetrics } from '../../../../utils/useOverviewMetrics';
import { isMobile } from '../list-view-utils';

type MetricsProps = {
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

const MetricsTooltip: React.FC<MetricsTooltipProps> = ({ metricLabel, byPod, children }) => {
  const sortedMetrics = _.orderBy(byPod, ['value', 'name'], ['desc', 'asc']);
  const content: any[] = _.isEmpty(sortedMetrics)
    ? [<React.Fragment key="no-metrics">No {metricLabel} metrics available.</React.Fragment>]
    : _.concat(
        <div className="project-overview__metric-tooltip-title" key="#title">
          {metricLabel} Usage by Pod
        </div>,
        sortedMetrics.map(({ name, formattedValue }) => (
          <div key={name} className="project-overview__metric-tooltip">
            <div className="project-overview__metric-tooltip-name">
              <span className="no-wrap">{truncateMiddle(name)}</span>
            </div>
            <div className="project-overview__metric-tooltip-value">{formattedValue}</div>
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

export const MetricsCell: React.FC<MetricsProps> = ({ item }) => {
  const { resources } = item.getData();
  const metrics = useOverviewMetrics();
  const getPods = () => {
    if (resources.obj.kind === 'Pod') {
      return [resources.obj];
    }
    return resources.current ? resources.current.pods : resources.pods;
  };

  if (_.isEmpty(metrics)) {
    return null;
  }

  let totalBytes = 0;
  let totalCores = 0;
  const memoryByPod = [];
  const cpuByPod = [];
  _.each(getPods(), ({ metadata: { name } }: K8sResourceKind) => {
    const bytes = _.get(metrics, ['memory', name]);
    if (_.isFinite(bytes)) {
      totalBytes += bytes;
      const formattedValue = `${formatBytesAsMiB(bytes)} MiB`;
      memoryByPod.push({ name, value: bytes, formattedValue });
    }

    const cores = _.get(metrics, ['cpu', name]);
    if (_.isFinite(cores)) {
      totalCores += cores;
      cpuByPod[name] = `${formatCores(cores)} cores`;
      const formattedValue = `${formatCores(cores)} cores`;
      cpuByPod.push({ name, value: cores, formattedValue });
    }
  });

  if (!totalBytes && !totalCores) {
    return null;
  }

  const formattedMiB = formatBytesAsMiB(totalBytes);
  const formattedCores = formatCores(totalCores);
  return (
    <DataListCell id={`${item.getId()}_metrics`}>
      <div className="project-overview__detail project-overview__detail--memory">
        <MetricsTooltip metricLabel="Memory" byPod={memoryByPod}>
          <span>
            <span className="project-overview__metric-value">{formattedMiB}</span>
            &nbsp;
            <span className="project-overview__metric-unit">MiB</span>
          </span>
        </MetricsTooltip>
      </div>
      <div className="project-overview__detail project-overview__detail--cpu">
        <MetricsTooltip metricLabel="CPU" byPod={cpuByPod}>
          <span>
            <span className="project-overview__metric-value">{formattedCores}</span>
            &nbsp;
            <span className="project-overview__metric-unit">cores</span>
          </span>
        </MetricsTooltip>
      </div>
    </DataListCell>
  );
};
