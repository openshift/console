import * as React from 'react';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { TriggerBindingModel, TriggerTemplateModel } from '../../../models';
import { EventListenerKind } from '../resource-types';
import DynamicResourceLinkList, {
  ResourceModelLink,
} from '../resource-overview/DynamicResourceLinkList';
import TriggerTemplateResourceLink from '../resource-overview/TriggerTemplateResourceLink';
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
  const bindings: ResourceModelLink[] = getEventListenerTriggerBindingNames(eventListener);
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
