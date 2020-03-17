import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import * as _ from 'lodash';
import { fromNow } from '@console/internal/components/utils/datetime';
import { EventKind } from '@console/internal/module/k8s';
import './MonitoringOverviewEventsWarning.scss';

interface MonitoringOverviewEventsWarningProps {
  events: EventKind[];
}

const MonitoringOverviewEventsWarning: React.FC<MonitoringOverviewEventsWarningProps> = ({
  events,
}) => (
  <div className="odc-monitoring-events-warning">
    {!_.isEmpty(events) ? (
      _.map(events, (e: EventKind) => {
        return (
          <Alert variant="warning" isInline title={e.reason} key={e.metadata.uid}>
            {e.message}
            <div className="odc-monitoring-events-warning__timestamp">
              <small className="text-secondary">{fromNow(e.lastTimestamp)}</small>
            </div>
          </Alert>
        );
      })
    ) : (
      <div className="text-secondary odc-monitoring-events-warning__no-alerts">
        There are no warning events.
      </div>
    )}
  </div>
);

export default MonitoringOverviewEventsWarning;
