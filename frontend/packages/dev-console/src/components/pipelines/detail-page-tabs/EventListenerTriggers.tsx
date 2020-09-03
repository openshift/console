import * as React from 'react';
import * as _ from 'lodash';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TriggerTemplateModel } from '../../../models';
import { EventListenerKindTrigger } from '../resource-types';
import DynamicResourceLinkList, {
  ResourceModelLink,
} from '../resource-overview/DynamicResourceLinkList';
import { getEventListenerTriggerBindingNames } from '../utils/triggers';
import './EventListenerTriggers.scss';

interface EventListenerTriggersProps {
  triggers: EventListenerKindTrigger[];
  namespace: string;
}

const EventListenerTriggers: React.FC<EventListenerTriggersProps> = ({ namespace, triggers }) => {
  return (
    <dl>
      <dt>Triggers</dt>
      <dd>
        {triggers.map((trigger) => {
          const triggerTemplateKind = referenceForModel(TriggerTemplateModel);
          const triggerTemplateName = trigger.template.name;
          const bindings: ResourceModelLink[] = getEventListenerTriggerBindingNames(
            trigger.bindings,
          );
          return (
            <div key={`${triggerTemplateKind}/${triggerTemplateName}`}>
              <ResourceLink
                kind={triggerTemplateKind}
                name={triggerTemplateName}
                displayName={triggerTemplateName}
                namespace={namespace}
                title={triggerTemplateName}
                inline
              />
              {!_.isEmpty(bindings) && (
                <div className="odc-event-listener-triggers__bindings">
                  <DynamicResourceLinkList
                    links={bindings}
                    namespace={namespace}
                    removeSpaceBelow
                  />
                </div>
              )}
            </div>
          );
        })}
      </dd>
    </dl>
  );
};

export default EventListenerTriggers;
