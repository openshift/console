import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TriggerTemplateModel } from '../../../models';
import DynamicResourceLinkList, {
  ResourceModelLink,
} from '../resource-overview/DynamicResourceLinkList';
import { EventListenerKindTrigger } from '../resource-types';
import { getEventListenerTriggerBindingNames } from '../utils/triggers';
import './EventListenerTriggers.scss';

interface EventListenerTriggersProps {
  triggers: EventListenerKindTrigger[];
  namespace: string;
}

const EventListenerTriggers: React.FC<EventListenerTriggersProps> = ({ namespace, triggers }) => {
  const { t } = useTranslation();
  const triggerTemplates = triggers.filter((tr) => tr.template?.ref || tr.template?.name);
  if (triggerTemplates.length === 0) {
    return null;
  }
  return (
    <dl>
      <dt>{t('pipelines-plugin~Triggers')}</dt>
      <dd>
        {triggerTemplates.map((trigger) => {
          const triggerTemplateKind = referenceForModel(TriggerTemplateModel);
          const triggerTemplateName = trigger.template?.ref || trigger.template?.name;
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
