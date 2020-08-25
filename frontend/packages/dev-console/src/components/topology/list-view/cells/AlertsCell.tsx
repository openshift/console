import * as React from 'react';
import * as _ from 'lodash';
import { Node } from '@patternfly/react-topology';
import { DataListCell, Tooltip } from '@patternfly/react-core';
import { Status as TooltipStatus } from '@console/shared';
import { pluralize } from '@console/internal/components/utils';
import { isMobile } from '../list-view-utils';

import './AlertsCell.scss';

type AlertsProps = {
  item: Node;
};

const AlertTooltip = ({ alerts, severity, noSeverityLabel = false }) => {
  if (!alerts) {
    return null;
  }

  const label = severity === 'Info' ? 'Message' : severity;
  const count = alerts.length;
  const message = _.uniq(alerts.map((a) => a.message)).join('\n');

  const status = (
    <span className="odc-topology-list-view__alert-cell--status">
      <TooltipStatus
        status={severity}
        title={noSeverityLabel ? String(count) : pluralize(count, label)}
      />
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
        {error && <AlertTooltip severity="Error" alerts={error} />}
        {warning && <AlertTooltip severity="Warning" alerts={warning} />}
        {info && <AlertTooltip severity="Info" alerts={info} />}
        {(buildNew || buildPending || buildRunning || buildFailed || buildError) && (
          <div className="odc-topology-list-view__alert-cell__builds">
            Builds {buildNew && <AlertTooltip severity="New" alerts={buildNew} noSeverityLabel />}{' '}
            {buildPending && (
              <AlertTooltip severity="Pending" alerts={buildPending} noSeverityLabel />
            )}{' '}
            {buildRunning && (
              <AlertTooltip severity="Running" alerts={buildRunning} noSeverityLabel />
            )}{' '}
            {buildFailed && <AlertTooltip severity="Failed" alerts={buildFailed} noSeverityLabel />}{' '}
            {buildError && <AlertTooltip severity="Error" alerts={buildError} noSeverityLabel />}
          </div>
        )}
      </div>
    </DataListCell>
  );
};
