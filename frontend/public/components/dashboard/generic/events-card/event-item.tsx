import * as React from 'react';

import { RedExclamationCircleIcon } from '@console/shared';
import { referenceFor } from '../../../../module/k8s';
import { Timestamp, ResourceLink } from '../../../utils';
import { EventComponentProps } from '../../../utils/event-stream';
import { categoryFilter } from '../../../events';

export const EventItem: React.FC<EventComponentProps> = React.memo(({ event }) => {
  const { lastTimestamp, message } = event;
  const isError = categoryFilter('error', event);
  return (
    <div className="co-events-card__item">
      <div className="co-recent-item__title">
        <div className="co-recent-item__title-timestamp text-secondary">
          {twentyFourHourTime(new Date(lastTimestamp))}
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
