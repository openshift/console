import * as React from 'react';

import { RedExclamationCircleIcon } from '@console/shared';
import { Timestamp, ResourceLink } from '../../utils';
import { EventComponentProps } from '../../utils/event-stream';
import { categoryFilter } from '../../events';

export const EventItem: React.FC<EventComponentProps> = React.memo(({ event }) => {
  const { lastTimestamp, involvedObject: obj, message } = event;
  const isError = categoryFilter('error', event);
  return (
    <div className="co-events-card__item">
      <small>
        <Timestamp simple className="co-events-card__item-timestamp text-secondary" timestamp={lastTimestamp} />
      </small>
      <div className="co-events-card__item-subheader">
        {isError && <RedExclamationCircleIcon className="co-events-card__item-icon--error" />}
        <ResourceLink
          className="co-events-card__item-resourcelink"
          kind={obj.kind}
          namespace={obj.namespace}
          name={obj.name}
          title={obj.uid}
        />
      </div>
      <div className="co-events-card__item-message text-secondary">
        {message}
      </div>
    </div>
  );
});
