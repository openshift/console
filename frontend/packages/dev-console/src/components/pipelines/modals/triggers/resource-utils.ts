import { getRandomChars } from '@console/shared';
import { apiVersionForModel, RouteKind } from '@console/internal/module/k8s';
import { RouteModel } from '@console/internal/models';
import { EventListenerModel, TriggerTemplateModel } from '../../../../models';
import { Pipeline, PipelineRun } from '../../../../utils/pipeline-augment';
import { PIPELINE_SERVICE_ACCOUNT } from '../../const';
import { getPipelineOperatorVersion } from '../../utils/pipeline-operator';
import {
  EventListenerKind,
  EventListenerKindBindingReference,
  TriggerBindingKind,
  TriggerTemplateKind,
  TriggerTemplateKindParam,
} from '../../resource-types';

export const createTriggerTemplate = (
  pipeline: Pipeline,
  pipelineRun: PipelineRun,
  params: TriggerTemplateKindParam[],
): TriggerTemplateKind => {
  return {
    apiVersion: apiVersionForModel(TriggerTemplateModel),
    kind: TriggerTemplateModel.kind,
    metadata: {
      name: `trigger-template-${pipeline.metadata.name}-${getRandomChars()}`,
    },
    spec: {
      params,
      resourcetemplates: [pipelineRun],
    },
  };
};

export const createEventListener = async (
  namespace: string,
  triggerBindings: TriggerBindingKind[],
  triggerTemplate: TriggerTemplateKind,
): Promise<EventListenerKind> => {
  const pipelineOperatorVersion = await getPipelineOperatorVersion(namespace);

  const mapTriggerBindings: (
    triggerBinding: TriggerBindingKind,
  ) => EventListenerKindBindingReference = (triggerBinding: TriggerBindingKind) => {
    // The Tekton CRD `EventListeners` before Tekton Triggers 0.5 requires a name
    // instead of a ref here to link `TriggerBinding` or `ClusterTriggerBinding`.
    if (
      pipelineOperatorVersion?.major === 0 ||
      (pipelineOperatorVersion?.major === 1 && pipelineOperatorVersion?.minor === 0)
    ) {
      return {
        kind: triggerBinding.kind,
        name: triggerBinding.metadata.name,
      } as EventListenerKindBindingReference;
    }
    return {
      kind: triggerBinding.kind,
      ref: triggerBinding.metadata.name,
    };
  };

  return {
    apiVersion: apiVersionForModel(EventListenerModel),
    kind: EventListenerModel.kind,
    metadata: {
      name: `event-listener-${getRandomChars()}`,
    },
    spec: {
      serviceAccountName: PIPELINE_SERVICE_ACCOUNT,
      triggers: [
        {
          bindings: triggerBindings.map(mapTriggerBindings),
          template: { name: triggerTemplate.metadata.name },
        },
      ],
    },
  };
};

export const createEventListenerRoute = (
  eventListener: EventListenerKind,
  generatedName?: string,
  targetPort: number = 8080,
): RouteKind => {
  const eventListenerName = eventListener.metadata.name;
  // Not ideal, but if all else fails, we can do our best guess
  const referenceName = generatedName || `el-${eventListenerName}`;

  return {
    apiVersion: apiVersionForModel(RouteModel),
    kind: RouteModel.kind,
    metadata: {
      name: referenceName,
      labels: {
        'app.kubernetes.io/managed-by': EventListenerModel.kind,
        'app.kubernetes.io/part-of': 'Triggers',
        eventlistener: eventListenerName,
      },
    },
    spec: {
      port: {
        targetPort,
      },
      to: {
        kind: 'Service',
        name: referenceName,
        weight: 100,
      },
    },
  };
};
