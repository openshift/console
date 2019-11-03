import * as React from 'react';
import { Area } from '@console/internal/components/graphs/area';
import { humanizeDecimalBytesPerSec } from '@console/internal/components/utils';

// Build the RouteCharts component that presents 3 charts side by side in full screen
const chartClasses = 'col-md-4 col-sm-12';

export const RouteCharts: React.FC<RouteChartsProps> = ({ namespace, route }) => {
  const interval = '[5m]';
  const namespaceRouteQuery = `{exported_namespace="${namespace}",route="${route}"}${interval}`;
  return (
    <div className="row">
      <div className={chartClasses}>
        <Area
          title="Traffic In"
          namespace={namespace}
          humanize={humanizeDecimalBytesPerSec}
          query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_server_bytes_in_total${namespaceRouteQuery}))`}
        />
      </div>
      <div className={chartClasses}>
        <Area
          title="Traffic Out"
          humanize={humanizeDecimalBytesPerSec}
          namespace={namespace}
          query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_server_bytes_out_total${namespaceRouteQuery}))`}
        />
      </div>
      <div className={chartClasses}>
        <Area
          title="Connection Rate"
          namespace={namespace}
          query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_backend_connections_total${namespaceRouteQuery}))`}
        />
      </div>
    </div>
  );
};

export type RouteChartsProps = {
  namespace: string;
  route: string;
};
