import { k8sKill, k8sList, k8sPatch } from '@console/internal/module/k8s';
import { EventListenerModel, TriggerTemplateModel } from '../../../../models';
import { Pipeline } from '../../../../utils/pipeline-augment';
import { EventListenerKind } from '../../resource-types';
import { RemoveTriggerFormValues } from './types';

export const removeTrigger = async (values: RemoveTriggerFormValues, pipeline: Pipeline) => {
  const ns = pipeline.metadata.namespace;
  const selectedTriggerTemplate = values.selectedTrigger;

  // Remove the selected TriggerTemplate
  await k8sKill(TriggerTemplateModel, {
    metadata: { name: selectedTriggerTemplate, namespace: ns },
  });

  const triggerMatchesTriggerTemplate = ({ template: { name } }) =>
    name === selectedTriggerTemplate;

  // Get all the event listeners so we can update their references
  const eventListeners: EventListenerKind[] = await k8sList(EventListenerModel, { ns });
  const matchingEventListeners = eventListeners.filter(({ spec: { triggers } }) =>
    triggers.find(triggerMatchesTriggerTemplate),
  );

  const singleTriggers = ({ spec: { triggers } }) => triggers.length === 1;

  // Delete all EventListeners that only had the one trigger
  const deletableEventListeners: EventListenerKind[] = matchingEventListeners.filter(
    singleTriggers,
  );
  await Promise.all(
    deletableEventListeners.map((eventListener) => k8sKill(EventListenerModel, eventListener)),
  );

  // Update all EventListeners that had more than one trigger
  const updatableEventListeners: EventListenerKind[] = matchingEventListeners.filter(
    (eventListener) => !singleTriggers(eventListener),
  );
  await Promise.all(
    updatableEventListeners.map((eventListener) =>
      k8sPatch(EventListenerModel, eventListener, [
        {
          opt: 'replace',
          path: '/spec/triggers',
          value: eventListener.spec.triggers.filter(triggerMatchesTriggerTemplate),
        },
      ]),
    ),
  );

  return Promise.resolve();
};
