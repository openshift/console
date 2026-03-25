import type { FC } from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getLastTime } from '@console/internal/components/events';
import { ResourceLink } from '@console/internal/components/utils';
import { timeFormatter } from '@console/internal/components/utils/datetime';
import type { EventKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import './MonitoringOverviewEvents.scss';

interface MonitoringOverviewEventsProps {
  events: EventKind[];
}

const MonitoringOverviewEvents: FC<MonitoringOverviewEventsProps> = ({ events }) => {
  const { t } = useTranslation();
  return (
    <div className="odc-monitoring-events">
      {!_.isEmpty(events) ? (
        _.map(events, (e: EventKind) => {
          return (
            <div className="odc-monitoring-events__event-item" key={e.metadata.uid}>
              <Flex alignSelf={{ default: 'alignSelfBaseline' }}>
                <FlexItem title={e.lastTimestamp} className="pf-v6-u-text-color-subtle">
                  {timeFormatter.format(new Date(getLastTime(e)))}
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
        <div className="pf-v6-u-text-color-subtle">
          {t('devconsole~There are no recent events.')}
        </div>
      )}
    </div>
  );
};

export default MonitoringOverviewEvents;
