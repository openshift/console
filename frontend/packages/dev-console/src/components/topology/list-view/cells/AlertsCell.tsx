import * as React from 'react';
import * as _ from 'lodash';
import { Node } from '@patternfly/react-topology';
import { DataListCell, Tooltip } from '@patternfly/react-core';
import { Status as TooltipStatus } from '@console/shared';
import { isMobile } from '../list-view-utils';

import './AlertsCell.scss';

type AlertsProps = {
  item: Node;
};

const AlertTooltip = ({ alerts, severity }) => {
  if (!alerts) {
    return null;
  }

  const count = alerts.length;
  const message = _.uniq(alerts.map((a) => a.message)).join('\n');

  const status = (
    <span className="odc-topology-list-view__alert-cell--status">
      <TooltipStatus status={severity} title={String(count)} />
    </span>
  );

  // No tooltip on mobile since a touch also opens the sidebar, which
  // immediately covers the tooltip content.
  if (isMobile()) {
    return status;
  }

  const tipContent = [
    <span key="message" className="co-pre-wrap">
      {message}
    </span>,
  ];
  return (
    <Tooltip content={tipContent} distance={10}>
      {status}
    </Tooltip>
  );
};

export const AlertsCell: React.FC<AlertsProps> = ({ item }) => {
  const { resources } = item.getData();
  const currentAlerts = resources?.current?.alerts ?? {};
  const previousAlerts = resources?.previous?.alerts ?? {};
  const itemAlerts = resources?.alerts;
  const alerts = {
    ...itemAlerts,
    ...currentAlerts,
    ...previousAlerts,
  };
  if (alerts?.length) {
    return null;
  }

  const {
    error,
    warning,
    info,
    buildNew,
    buildPending,
    buildRunning,
    buildFailed,
    buildError,
  } = _.groupBy(alerts, 'severity');
  return (
    <DataListCell id={`${item.getId()}_alerts`}>
      <div className="odc-topology-list-view__alert-cell">
        {(error || warning || info) && (
          <div className="odc-topology-list-view__alert-cell__status">
            <span className="odc-topology-list-view__alert-cell__label">Alerts:</span>
            <AlertTooltip severity="Error" alerts={error} />
            <AlertTooltip severity="Warning" alerts={warning} />
            <AlertTooltip severity="Info" alerts={info} />
          </div>
        )}
        {(buildNew || buildPending || buildRunning || buildFailed || buildError) && (
          <div className="odc-topology-list-view__alert-cell__status">
            <span className="odc-topology-list-view__alert-cell__label">Builds:</span>
            <AlertTooltip severity="New" alerts={buildNew} />
            <AlertTooltip severity="Pending" alerts={buildPending} />
            <AlertTooltip severity="Running" alerts={buildRunning} />
            <AlertTooltip severity="Failed" alerts={buildFailed} />
            <AlertTooltip severity="Error" alerts={buildError} />
          </div>
        )}
      </div>
    </DataListCell>
  );
};
