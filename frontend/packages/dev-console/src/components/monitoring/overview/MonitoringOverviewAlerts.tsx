import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { Alert as AlertType } from '@console/internal/components/monitoring/types';
import { labelsToParams } from '@console/internal/components/monitoring/utils';
import { fromNow } from '@console/internal/components/utils/datetime';
import { sortMonitoringAlerts, useActivePerspective } from '@console/shared';
import { getAlertType } from './monitoring-overview-alerts-utils';
import './MonitoringOverviewAlerts.scss';

interface MonitoringOverviewAlertsProps {
  alerts: AlertType[];
}

const MonitoringOverviewAlerts: React.FC<MonitoringOverviewAlertsProps> = ({ alerts }) => {
  const [activePerspective] = useActivePerspective();
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
            key={`${alertname}-${id}`}
          >
            {message}
            <div className="odc-monitoring-overview-alerts__timestamp">
              <small className="text-secondary">{fromNow(activeAt)}</small>
            </div>
          </Alert>
        );
      })}
    </div>
  );
};

export const InternalMonitoringOverviewAlerts = MonitoringOverviewAlerts;
export default MonitoringOverviewAlerts;
