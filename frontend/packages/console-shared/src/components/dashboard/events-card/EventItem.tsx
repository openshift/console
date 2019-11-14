import * as React from 'react';
import { RedExclamationCircleIcon } from '@console/shared';
import { categoryFilter } from '@console/internal/components/events';
import { EventComponentProps } from '@console/internal/components/utils/event-stream';
import { twentyFourHourTime } from '@console/internal/components/utils/datetime';

const EventItem: React.FC<EventComponentProps> = React.memo(({ event }) => {
  const { lastTimestamp, message } = event;
  const isError = categoryFilter('error', event);
  return (
    <div className="co-events-card__item">
      <div className="co-recent-item__title">
        <div className="co-recent-item__title-timestamp text-secondary">
          {lastTimestamp ? twentyFourHourTime(new Date(lastTimestamp)) : '-'}
        </div>
        <div className="co-recent-item__title-message">
          {isError && (
            <RedExclamationCircleIcon className="co-dashboard-icon co-recent-item__icon--error" />
          )}
        </div>
      </div>
      <div className="co-dashboard-text--small co-events-card__item-message">{message}</div>
    </div>
  );
});

export default EventItem;
