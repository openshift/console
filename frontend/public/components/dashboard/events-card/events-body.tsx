import * as React from 'react';
import { EventStream, EventStreamList, EventStreamChildProps, EventStreamProps } from '../../utils/event-stream';
import { EventItem } from './event-item';
import { NoEvents, NoMatchingEvents, ErrorLoadingEvents } from '../../events';
import { LoadingInline } from '../../utils';

const EventStreamBody: React.FC<Partial<EventStreamChildProps>> = ({ noEvents, noMatches, error, sortedMessages, loading, filteredEvents }) => {
  if (loading) {
    return <div className="co-events-card__body-loading"><LoadingInline /></div>;
  }
  if (error) {
    return <ErrorLoadingEvents />;
  }
  if (noMatches) {
    return <NoMatchingEvents allCount={sortedMessages.length} />;
  }
  if (noEvents) {
    return <NoEvents />;
  }

  return <EventStreamList events={filteredEvents || []} EventComponent={EventItem} scrollableElementId="events-body" />;
};

export const EventsBody: React.FC<EventStreamProps> = (props) => (
  <div className="co-events-card__body" id="events-body">
    <div className="co-events-card__body-stream">
      <EventStream {...props}>
        <EventStreamBody />
      </EventStream>
    </div>
  </div>
);
