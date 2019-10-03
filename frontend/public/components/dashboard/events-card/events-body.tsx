import * as React from 'react';
import * as _ from 'lodash-es';

import { EventStreamList } from '../../utils/event-stream';
import { EventItem } from './event-item';
import { ErrorLoadingEvents } from '../../events';
import { FirehoseResult } from '../../utils';
import { EventKind } from '../../../module/k8s';

export const EventsBody: React.FC<EventsBodyProps> = ({ events, filter }) => {
  let eventsBody;
  if (events && events.loadError) {
    eventsBody = <ErrorLoadingEvents />;
  } else if (!(events && events.loaded)) {
    eventsBody = <div className="skeleton-activity" />;
  } else {
    const filteredEvents = filter ? events.data.filter(filter) : events.data;
    const sortedEvents = _.orderBy(filteredEvents, ['lastTimestamp', 'name'], ['desc', 'asc']);
    eventsBody =
      filteredEvents.length === 0 ? (
        <div className="co-events-card__body-empty text-secondary">There are no recent events.</div>
      ) : (
        <EventStreamList
          events={sortedEvents}
          EventComponent={EventItem}
          scrollableElementId="events-body"
        />
      );
  }
  return (
    <div className="co-dashboard-card__body--no-padding co-events-card__body" id="events-body">
      <div className="co-events-card__body-stream">{eventsBody}</div>
    </div>
  );
};

type EventsBodyProps = {
  events: FirehoseResult<EventKind[]>;
  filter?: (event: EventKind) => boolean;
};
