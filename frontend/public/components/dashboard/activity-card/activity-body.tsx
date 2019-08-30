import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sActivityProps, PrometheusActivityProps } from '@console/plugin-sdk';
import { LazyLoader } from '@console/plugin-sdk/src/typings/types';
import { Accordion } from '@patternfly/react-core';
import { EventStreamList } from '../../utils/event-stream';
import { EventItem } from './event-item';
import { ErrorLoadingEvents } from '../../events';
import { AsyncComponent, FirehoseResult, Timestamp } from '../../utils';
import { EventKind, K8sResourceKind } from '../../../module/k8s';
import { PrometheusResponse } from '../../graphs';

const Activity: React.FC<ActivityProps> = ({ timestamp, children }) => (
  <div className="co-activity-item__ongoing">
    {timestamp && (
      <span className="text-secondary">
        Started <Timestamp simple timestamp={timestamp.toString()} />
      </span>
    )}
    {children}
  </div>
);

export const RecentEventsBody: React.FC<RecentEventsBodyProps> = ({ events, filter }) => {
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

  let eventsBody: React.ReactNode;
  if (events && events.loadError) {
    eventsBody = <ErrorLoadingEvents />;
  } else if (!(events && events.loaded)) {
    eventsBody = <div className="skeleton-activity" />;
  } else {
    const filteredEvents = filter ? events.data.filter(filter) : events.data;
    const sortedEvents = _.orderBy(filteredEvents, ['lastTimestamp', 'name'], ['desc', 'asc']);
    eventsBody =
      filteredEvents.length === 0 ? (
        <Activity>
          <div className="text-secondary">There are no recent events.</div>
        </Activity>
      ) : (
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
  }
  return (
    <>
      <div className="co-activity-card__recent-title">Recent events</div>
      {eventsBody}
    </>
  );
};

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

export const ActivityBody: React.FC<ActivityBodyProps> = ({ children }) => (
  <div className="co-dashboard-card__body--no-padding co-activity-card__body" id="activity-body">
    {children}
  </div>
);

type ActivityBodyProps = {
  children: React.ReactNode;
};

type OngoingActivityBodyProps = {
  resourceActivities: {
    resource: K8sResourceKind;
    timestamp: Date;
    loader: LazyLoader<K8sActivityProps>;
  }[];
  prometheusActivities: {
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
