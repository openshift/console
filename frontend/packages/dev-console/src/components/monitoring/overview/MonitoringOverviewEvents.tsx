import * as React from 'react';
import * as _ from 'lodash';
import { Flex, FlexItem, FlexModifiers } from '@patternfly/react-core';
import { twentyFourHourTime } from '@console/internal/components/utils/datetime';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { referenceFor, EventKind } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import MonitoringOverviewEventsWarning from './MonitoringOverviewEventsWarning';
import './MonitoringOverviewEvents.scss';

type MonitoringOverviewEventsProps = React.ComponentProps<typeof MonitoringOverviewEventsWarning>;

const MonitoringOverviewEvents: React.FC<MonitoringOverviewEventsProps> = ({ events }) => (
  <div className="odc-monitoring-events">
    {!_.isEmpty(events) ? (
      _.map(events, (e: EventKind) => {
        return (
          <div className="odc-monitoring-events__event-item" key={e.metadata.uid}>
            <Flex breakpointMods={[{ modifier: FlexModifiers['align-self-baseline'] }]}>
              <FlexItem title={e.lastTimestamp} className="text-secondary">
                {twentyFourHourTime(new Date(e.lastTimestamp))}
              </FlexItem>
              {e.type === 'Warning' && (
                <FlexItem>
                  <YellowExclamationTriangleIcon className="odc-monitoring-events__warning-icon" />
                </FlexItem>
              )}
              <FlexItem>
                <ResourceLink
                  kind={referenceFor(e.involvedObject)}
                  namespace={e.involvedObject.namespace}
                  name={e.involvedObject.name}
                  title={e.involvedObject.uid}
                />
              </FlexItem>
            </Flex>
            <div className="odc-monitoring-events__event-message">{e.message}</div>
          </div>
        );
      })
    ) : (
      <div className="text-secondary">There are no recent events.</div>
    )}
  </div>
);

export default MonitoringOverviewEvents;
