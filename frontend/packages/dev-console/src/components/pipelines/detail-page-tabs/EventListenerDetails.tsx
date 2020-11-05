import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { EventListenerKind } from '../resource-types';
import EventListenerURL from './EventListenerURL';
import EventListenerTriggers from './EventListenerTriggers';

export interface EventListenerDetailsProps {
  obj: EventListenerKind;
}

const EventListenerDetails: React.FC<EventListenerDetailsProps> = ({ obj: eventListener }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('devconsole~Event Listener Details')} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={eventListener} />
        </div>
        <div className="col-sm-6">
          <EventListenerURL
            eventListener={eventListener}
            namespace={eventListener.metadata.namespace}
          />
          <EventListenerTriggers
            namespace={eventListener.metadata.namespace}
            triggers={eventListener.spec.triggers}
          />
        </div>
      </div>
    </div>
  );
};

export default EventListenerDetails;
