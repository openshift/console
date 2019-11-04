import * as React from 'react';
import * as _ from 'lodash';
import classNames from 'classnames';
import { K8sActivityProps, PrometheusActivityProps, LazyLoader } from '@console/plugin-sdk';
import { Accordion } from '@patternfly/react-core';
import { Timestamp } from '@console/internal/components/utils/timestamp';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { FirehoseResult } from '@console/internal/components/utils/types';
import { ErrorLoadingEvents } from '@console/internal/components/events';
import { EventStreamList } from '@console/internal/components/utils/event-stream';
import { K8sResourceKind, EventKind } from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import EventItem from './EventItem';
import './activity-card.scss';

export const Activity: React.FC<ActivityProps> = ({ timestamp, children }) => (
  <div className="co-activity-item__ongoing">
    {timestamp && (
      <span className="text-secondary">
        Started <Timestamp simple timestamp={timestamp.toString()} />
      </span>
    )}
    {children}
  </div>
);

export const RecentEventsBodyContent: React.FC<RecentEventsBodyProps> = ({ events, filter }) => {
  const [expanded, setExpanded] = React.useState([]);
  const onToggle = React.useCallback(
    (uid: string) => {
      expanded.includes(uid)
        ? setExpanded(expanded.filter((e) => e !== uid))
        : setExpanded([...expanded, uid]);
    },
    [expanded],
  );
  const isExpanded = React.useCallback(
    (uid: string) => {
      return expanded.includes(uid);
    },
    [expanded],
  );
  const eventItem = React.useCallback(
    (props) => <EventItem isExpanded={isExpanded} onToggle={onToggle} {...props} />,
    [isExpanded, onToggle],
  );

  if (events && events.loadError) {
    return <ErrorLoadingEvents />;
  }
  if (!(events && events.loaded)) {
    return <div className="skeleton-activity" />;
  }

  const filteredEvents = filter ? events.data.filter(filter) : events.data;
  const sortedEvents = _.orderBy(filteredEvents, ['lastTimestamp', 'name'], ['desc', 'asc']);
  if (filteredEvents.length === 0) {
    return (
      <Activity>
        <div className="text-secondary">There are no recent events.</div>
      </Activity>
    );
  }
  return (
    <Accordion
      asDefinitionList={false}
      headingLevel="h5"
      className="co-activity-card__recent-accordion"
    >
      <EventStreamList
        className="co-activity-card__recent-list"
        events={sortedEvents}
        EventComponent={eventItem}
        scrollableElementId="activity-body"
      />
    </Accordion>
  );
};

export const RecentEventsBody: React.FC<RecentEventsBodyProps> = (props) => (
  <>
    <div className="co-activity-card__recent-title">Recent Events</div>
    <RecentEventsBodyContent {...props} />
  </>
);

export const OngoingActivityBody: React.FC<OngoingActivityBodyProps> = ({
  loaded,
  resourceActivities = [],
  prometheusActivities = [],
}) => {
  const activitiesLoaded =
    loaded || resourceActivities.length > 0 || prometheusActivities.length > 0;
  let body: React.ReactNode;
  if (!activitiesLoaded) {
    body = <div className="skeleton-activity" />;
  } else {
    const allActivities = prometheusActivities.map(({ results, loader }, idx) => (
      // eslint-disable-next-line react/no-array-index-key
      <Activity key={idx}>
        <AsyncComponent loader={loader} results={results} />
      </Activity>
    ));
    resourceActivities
      .sort((a, b) => +b.timestamp - +a.timestamp)
      .forEach(({ resource, timestamp, loader }) =>
        allActivities.push(
          <Activity key={resource.metadata.uid} timestamp={timestamp}>
            <AsyncComponent loader={loader} resource={resource} />
          </Activity>,
        ),
      );
    body = allActivities.length ? (
      allActivities
    ) : (
      <Activity>
        <div className="text-secondary">There are no ongoing activities.</div>
      </Activity>
    );
  }
  return (
    <>
      <div className="co-activity-card__ongoing-title">Ongoing</div>
      <div className="co-activity-card__ongoing-body">{body}</div>
    </>
  );
};

const ActivityBody: React.FC<ActivityBodyProps> = ({ children, className }) => (
  <div
    className={classNames('co-dashboard-card__body--no-padding co-activity-card__body', className)}
    id="activity-body"
  >
    {children}
  </div>
);

export default ActivityBody;

type ActivityBodyProps = {
  children: React.ReactNode;
  className?: string;
};

type OngoingActivityBodyProps = {
  resourceActivities?: {
    resource: K8sResourceKind;
    timestamp: Date;
    loader: LazyLoader<K8sActivityProps>;
  }[];
  prometheusActivities?: {
    results: PrometheusResponse[];
    loader: LazyLoader<PrometheusActivityProps>;
  }[];
  loaded: boolean;
};

type RecentEventsBodyProps = {
  events: FirehoseResult<EventKind[]>;
  filter?: (event: EventKind) => boolean;
};

type ActivityProps = {
  timestamp?: Date;
  children: React.ReactNode;
};
