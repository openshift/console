import * as React from 'react';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { TriggerTemplateModel, TriggerBindingModel } from '../../../models';
import { EventListenerKind } from '../resource-types';
import TriggerTemplateResourceLink from '../resource-overview/TriggerTemplateResourceLink';
import ResourceLinkList from '../resource-overview/ResourceLinkList';
import {
  RouteTemplate,
  useEventListenerTriggerTemplateNames,
  getEventListenerTriggerBindingNames,
} from '../utils/triggers';

export interface EventListenerDetailsProps {
  obj: EventListenerKind;
}

const EventListenerDetails: React.FC<EventListenerDetailsProps> = ({ obj: eventListener }) => {
  const routeTemplates: RouteTemplate[] = useEventListenerTriggerTemplateNames(eventListener) || [];
  const bindings: string[] = getEventListenerTriggerBindingNames(eventListener) || [];
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Event Listener Details" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={eventListener} />
        </div>
        <div className="col-sm-6">
          <TriggerTemplateResourceLink
            namespace={eventListener.metadata.namespace}
            model={TriggerTemplateModel}
            links={routeTemplates}
          />
          <ResourceLinkList
            namespace={eventListener.metadata.namespace}
            model={TriggerBindingModel}
            links={bindings}
          />
        </div>
      </div>
    </div>
  );
};

export default EventListenerDetails;
