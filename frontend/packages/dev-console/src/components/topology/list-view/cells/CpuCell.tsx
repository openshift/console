import * as React from 'react';
import * as _ from 'lodash';
import { Node } from '@patternfly/react-topology';
import { DataListCell } from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { formatBytesAsMiB, formatCores } from '@console/internal/components/utils';
import { useOverviewMetrics } from '../../../../utils/useOverviewMetrics';
import { MetricsTooltip } from './MetricsTooltip';

import './MetricsCell.scss';

type CpuCellProps = {
  item: Node;
};

export const CpuCell: React.FC<CpuCellProps> = ({ item }) => {
  const { resources } = item.getData();
  const metrics = useOverviewMetrics();
  const getPods = () => {
    if (resources.obj.kind === 'Pod') {
      return [resources.obj];
    }
    return resources.current ? resources.current.pods : resources.pods;
  };

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

  return (
    <DataListCell id={`${item.getId()}_metrics`}>
      {_.isEmpty(metrics) || !totalBytes || !totalCores ? null : (
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
      )}
    </DataListCell>
  );
};
