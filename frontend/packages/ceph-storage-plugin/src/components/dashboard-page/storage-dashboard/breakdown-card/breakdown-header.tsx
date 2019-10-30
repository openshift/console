import * as React from 'react';
import { MonitoringRoutes, connectToURLs } from '@console/internal/reducers/monitoring';
import { ExternalLink } from '@console/internal/components/utils';
import { getPrometheusExpressionBrowserURL } from '@console/internal/components/graphs/prometheus-graph';

const HeaderPrometheusViewLink: React.FC<HeaderPrometheusViewLinkProps> = ({ link, urls }) => (
  <div className="capacity-breakdown-card__header-link">
    <ExternalLink href={getPrometheusExpressionBrowserURL(urls, link)} text="View more" />
  </div>
);

export default connectToURLs(MonitoringRoutes.Prometheus)(HeaderPrometheusViewLink);

type HeaderPrometheusViewLinkProps = { link: string[]; urls: string[] };
