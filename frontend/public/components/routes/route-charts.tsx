import * as React from 'react';
import { FLAGS } from '@console/shared/src/constants';
import { Area } from '@console/internal/components/graphs/area';
import { humanizeDecimalBytesPerSec } from '@console/internal/components/utils';
import { connectToFlags, WithFlagsProps } from '../../reducers/features';
import { useTranslation } from 'react-i18next';

// Build the RouteCharts component that presents 3 charts side by side in full screen
const chartClasses = 'col-md-4 col-sm-12';

const RouteCharts_: React.FC<RouteChartsProps> = ({ namespace, route, flags }) => {
  const { t } = useTranslation();
  if (!flags[FLAGS.CAN_GET_NS]) {
    return null;
  }

  const interval = '[5m]';
  const namespaceRouteQuery = `{exported_namespace="${namespace}",route="${route}"}${interval}`;
  return (
    <div className="row">
      <div className={chartClasses}>
        <Area
          title={t('network-route~Traffic in')}
          humanize={humanizeDecimalBytesPerSec}
          query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_server_bytes_in_total${namespaceRouteQuery}))`}
        />
      </div>
      <div className={chartClasses}>
        <Area
          title={t('network-route~Traffic out')}
          humanize={humanizeDecimalBytesPerSec}
          query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_server_bytes_out_total${namespaceRouteQuery}))`}
        />
      </div>
      <div className={chartClasses}>
        <Area
          title={t('network-route~Connection rate')}
          query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_backend_connections_total${namespaceRouteQuery}))`}
        />
      </div>
    </div>
  );
};
export const RouteCharts = connectToFlags<RouteChartsProps>(FLAGS.CAN_GET_NS)(RouteCharts_);

export type RouteChartsProps = {
  namespace: string;
  route: string;
} & WithFlagsProps;
