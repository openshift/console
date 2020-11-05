import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Flex, FlexItem } from '@patternfly/react-core';
import { twentyFourHourTime } from '@console/internal/components/utils/datetime';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { referenceFor, EventKind } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import { getLastTime } from '@console/internal/components/events';
import './MonitoringOverviewEvents.scss';

interface MonitoringOverviewEventsProps {
  events: EventKind[];
}

const MonitoringOverviewEvents: React.FC<MonitoringOverviewEventsProps> = ({ events }) => {
  const { t } = useTranslation();
  return (
    <div className="odc-monitoring-events">
      {!_.isEmpty(events) ? (
        _.map(events, (e: EventKind) => {
          return (
            <div className="odc-monitoring-events__event-item" key={e.metadata.uid}>
              <Flex alignSelf={{ default: 'alignSelfBaseline' }}>
                <FlexItem title={e.lastTimestamp} className="text-secondary">
                  {twentyFourHourTime(new Date(getLastTime(e)))}
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
        <div className="text-secondary">{t('devconsole~There are no recent events.')}</div>
      )}
    </div>
  );
};

export default MonitoringOverviewEvents;
