import * as React from 'react';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { TriggerBindingModel, TriggerTemplateModel } from '../../../models';
import { EventListenerKind } from '../resource-types';
import EventListenerURL from './EventListenerURL';
import DynamicResourceLinkList, {
  ResourceModelLink,
} from '../resource-overview/DynamicResourceLinkList';
import {
  getEventListenerTriggerTemplateNames,
  getEventListenerTriggerBindingNames,
} from '../utils/triggers';

export interface EventListenerDetailsProps {
  obj: EventListenerKind;
}

const EventListenerDetails: React.FC<EventListenerDetailsProps> = ({ obj: eventListener }) => {
  const templates: ResourceModelLink[] = getEventListenerTriggerTemplateNames(eventListener);
  const bindings: ResourceModelLink[] = getEventListenerTriggerBindingNames(eventListener);
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Event Listener Details" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={eventListener} />
        </div>
        <div className="col-sm-6">
          <EventListenerURL
            eventListener={eventListener}
            namespace={eventListener.metadata.namespace}
          />
          <DynamicResourceLinkList
            links={templates}
            namespace={eventListener.metadata.namespace}
            title={TriggerTemplateModel.labelPlural}
          />
          <DynamicResourceLinkList
            links={bindings}
            namespace={eventListener.metadata.namespace}
            title={TriggerBindingModel.labelPlural}
          />
        </div>
      </div>
    </div>
  );
};

export default EventListenerDetails;
