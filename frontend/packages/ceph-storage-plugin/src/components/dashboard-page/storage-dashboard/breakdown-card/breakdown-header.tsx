import * as React from 'react';
import { Link } from 'react-router-dom';

export const HeaderPrometheusViewLink: React.FC<HeaderPrometheusViewLinkProps> = ({ link }) => {
  const params = new URLSearchParams();
  params.set('query0', link);
  return (
    <div className="capacity-breakdown-card__header-link">
      <Link to={`/monitoring/query-browser?${params}`}>View more</Link>
    </div>
  );
};

type HeaderPrometheusViewLinkProps = { link: string };
