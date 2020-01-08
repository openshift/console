import * as React from 'react';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';

export const HeaderPrometheusViewLink: React.FC<HeaderPrometheusViewLinkProps> = ({ link }) => {
  const params = new URLSearchParams();
  params.set('query0', link);
  return (
    <DashboardCardLink to={`/monitoring/query-browser?${params}`}>View more</DashboardCardLink>
  );
};

type HeaderPrometheusViewLinkProps = { link: string };
