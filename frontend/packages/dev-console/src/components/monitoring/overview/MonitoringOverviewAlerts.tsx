import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import * as _ from 'lodash';
import { Link } from 'react-router-dom-v5-compat';
import { Alert as AlertType, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { labelsToParams } from '@console/internal/components/monitoring/utils';
import { fromNow } from '@console/internal/components/utils/datetime';
import { sortMonitoringAlerts } from '@console/shared';
import { getAlertType } from './monitoring-overview-alerts-utils';
import './MonitoringOverviewAlerts.scss';

interface MonitoringOverviewAlertsProps {
  alerts: AlertType[];
}

const MonitoringOverviewAlerts: React.FC<MonitoringOverviewAlertsProps> = ({ alerts }) => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const sortedAlerts = sortMonitoringAlerts(alerts);

  return (
    <div className="odc-monitoring-overview-alerts">
      {_.map(sortedAlerts, (alert: AlertType) => {
        const {
          activeAt,
          annotations: { message },
          labels: { severity, alertname, namespace },
          rule: { name, id },
        } = alert;
        const alertDetailsPageLink =
          activePerspective === 'admin'
            ? `/monitoring/alerts/${id}?${labelsToParams(alert.labels)}`
            : `/dev-monitoring/ns/${namespace}/alerts/${id}?${labelsToParams(alert.labels)}`;
        return (
          <Alert
            variant={getAlertType(severity)}
            isInline
            title={<Link to={alertDetailsPageLink}>{name}</Link>}
            onClick={() => {
              if (
                alertDetailsPageLink.startsWith('/dev-monitoring') &&
                activePerspective !== 'dev'
              ) {
                setActivePerspective('dev');
              }
            }}
            key={`${alertname}-${id}`}
          >
            {message}
            <div className="odc-monitoring-overview-alerts__timestamp">
              <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
                {fromNow(activeAt)}
              </span>
            </div>
          </Alert>
        );
      })}
    </div>
  );
};

export const InternalMonitoringOverviewAlerts = MonitoringOverviewAlerts;
export default MonitoringOverviewAlerts;
