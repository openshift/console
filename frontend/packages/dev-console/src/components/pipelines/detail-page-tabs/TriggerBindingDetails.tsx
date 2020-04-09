import * as React from 'react';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { EventListenerModel } from '../../../models';
import ResourceLinkList from '../resource-overview/ResourceLinkList';
import { useTriggerBindingEventListenerNames } from '../utils/triggers';
import { TriggerBindingKind } from '../resource-types';

export interface TriggerBindingDetailsProps {
  obj: TriggerBindingKind;
}

const TriggerBindingDetails: React.FC<TriggerBindingDetailsProps> = ({ obj: triggerBinding }) => {
  const eventListeners: string[] = useTriggerBindingEventListenerNames(triggerBinding);
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Trigger Binding Details" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={triggerBinding} />
        </div>
        <div className="col-sm-6">
          <ResourceLinkList
            namespace={triggerBinding.metadata.namespace}
            model={EventListenerModel}
            links={eventListeners}
          />
        </div>
      </div>
    </div>
  );
};

export default TriggerBindingDetails;
