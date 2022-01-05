import {
  EventListenerKind,
  EventListenerKindTrigger,
} from '../components/pipelines/resource-types/triggers';

export enum TriggerTypes {
  BINDING_TEMPLATE_NAME = 'bindings-and-template-name',
  BINDING_TEMPLATE_REF = 'bindings-and-template-ref',
  TRIGGER_REF = 'trigger-ref',
}

export enum EventlistenerTypes {
  BINDINGS_TEMPLATE_REF = 'el-with-bindings-template-ref',
  BINDINGS_TEMPLATE_NAME = 'el-with-bindings-template-name',
  TRIGGER_REF = 'el-with-triggerRef',
}

type TriggerTestData = { [key in TriggerTypes]?: EventListenerKindTrigger };
type EventListenerTestData = { [key in EventlistenerTypes]?: EventListenerKind };
export const TriggerTestData: TriggerTestData = {
  [TriggerTypes.BINDING_TEMPLATE_REF]: {
    name: 'foo-trig',
    bindings: [
      {
        ref: 'pipeline-binding',
      },
      {
        ref: 'message-binding',
      },
    ],
    template: {
      ref: 'pipeline-template',
    },
  },
  [TriggerTypes.BINDING_TEMPLATE_NAME]: {
    name: 'foo-trig',
    bindings: [
      {
        ref: 'pipeline-binding',
      },
      {
        ref: 'message-binding',
      },
    ],
    template: {
      name: 'pipeline-template',
    },
  },
  [TriggerTypes.TRIGGER_REF]: {
    triggerRef: 'vote-trigger',
  },
};
export const EventlistenerTestData: EventListenerTestData = {
  [EventlistenerTypes.BINDINGS_TEMPLATE_REF]: {
    apiVersion: 'triggers.tekton.dev/v1alpha1',
    kind: 'EventListener',
    metadata: {
      name: 'el-listener-ref',
    },
    spec: {
      serviceAccountName: 'trigger-sa',
      triggers: [TriggerTestData[TriggerTypes.BINDING_TEMPLATE_REF]],
    },
  },
  [EventlistenerTypes.BINDINGS_TEMPLATE_NAME]: {
    apiVersion: 'triggers.tekton.dev/v1alpha1',
    kind: 'EventListener',
    metadata: {
      name: 'el-listener-name',
    },
    spec: {
      serviceAccountName: 'trigger-sa',
      triggers: [TriggerTestData[TriggerTypes.BINDING_TEMPLATE_NAME]],
    },
  },

  [EventlistenerTypes.TRIGGER_REF]: {
    apiVersion: 'triggers.tekton.dev/v1alpha1',
    kind: 'EventListener',
    metadata: {
      name: 'vote-app',
    },
    spec: {
      serviceAccountName: 'trigger-sa',
      triggers: [TriggerTestData[TriggerTypes.TRIGGER_REF]],
    },
  },
};
