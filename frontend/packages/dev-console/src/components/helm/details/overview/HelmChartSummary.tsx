import * as React from 'react';
import { HelmRelease } from '../../helm-types';
import { Timestamp } from '@console/internal/components/utils';

interface HelmChartSummaryProps {
  helmRelease: HelmRelease;
}

const HelmChartSummary: React.FC<HelmChartSummaryProps> = ({ helmRelease }) => {
  if (!helmRelease) return null;

  const {
    chart: {
      metadata: { name: chartName, version: chartVersion, appVersion },
    },
    info: { last_deployed: updated },
    version: revision,
  } = helmRelease;

  return (
    <dl className="co-m-pane__details">
      <dt>Chart Name</dt>
      <dd>{chartName}</dd>
      <dt>Chart Version</dt>
      <dd>{chartVersion}</dd>
      <dt>App Version</dt>
      <dd>{appVersion}</dd>
      <dt>Revision</dt>
      <dd>{revision}</dd>
      <dt>Updated</dt>
      <dd>
        <Timestamp timestamp={updated} />
      </dd>
    </dl>
  );
};

export default HelmChartSummary;
