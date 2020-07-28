import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Node, SELECTION_EVENT } from '@patternfly/react-topology';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Alert } from '@console/internal/components/monitoring/types';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import { getSeverityAlertType, getFiringAlerts, AlertSeverityIcon } from '@console/shared';
import { Decorator } from './Decorator';

type DispatchProps = {
  showMonitoringOverview?: () => void;
};

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  showMonitoringOverview: () => dispatch(selectOverviewDetailsTab('Monitoring')),
});

interface MonitoringAlertsDecoratorProps {
  monitoringAlerts: Alert[];
  workload: Node;
  radius: number;
  x: number;
  y: number;
}

type MonitoringAlertsDecoratorType = MonitoringAlertsDecoratorProps & DispatchProps;

const MonitoringAlertsDecorator: React.FC<MonitoringAlertsDecoratorType> = ({
  monitoringAlerts,
  workload,
  radius,
  x,
  y,
  showMonitoringOverview,
}) => {
  const firingAlerts = getFiringAlerts(monitoringAlerts);
  const severityAlertType = getSeverityAlertType(firingAlerts);

  const showSidebar = (e: React.MouseEvent) => {
    e.stopPropagation();
    showMonitoringOverview();
    workload
      .getGraph()
      .getController()
      .fireEvent(SELECTION_EVENT, [workload.getId()]);
  };

  return (
    firingAlerts.length > 0 && (
      <Tooltip key="monitoringAlert" content="Monitoring Alert" position={TooltipPosition.left}>
        <Decorator x={x} y={y} radius={radius} onClick={showSidebar}>
          <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
            <AlertSeverityIcon severityAlertType={severityAlertType} fontSize={radius} />
          </g>
        </Decorator>
      </Tooltip>
    )
  );
};

export default connect<null, DispatchProps, MonitoringAlertsDecoratorProps>(
  null,
  dispatchToProps,
)(MonitoringAlertsDecorator);
