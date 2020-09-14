import { RouteModel, ServiceModel } from '@console/internal/models';
import { errorModal } from '@console/internal/components/modals';
import { k8sCreate, k8sGet, K8sResourceKind, RouteKind } from '@console/internal/module/k8s';
import { EventListenerModel, TriggerTemplateModel } from '../../../../models';
import { Pipeline, PipelineRun } from '../../../../utils/pipeline-augment';
import {
  EventListenerKind,
  TriggerTemplateKind,
  TriggerTemplateKindParam,
} from '../../resource-types';
import { getPipelineRunFromForm } from '../common/utils';
import {
  createEventListener,
  createEventListenerRoute,
  createTriggerTemplate,
} from './resource-utils';
import { AddTriggerFormValues } from './types';

const exposeRoute = async (elName: string, ns: string, iteration = 0) => {
  const elResource: EventListenerKind = await k8sGet(EventListenerModel, elName, ns);
  const serviceGeneratedName = elResource?.status?.configuration.generatedName;

  try {
    if (!serviceGeneratedName) {
      if (iteration < 3) {
        setTimeout(() => exposeRoute(elName, ns, iteration + 1), 500);
      } else {
        // Unable to deterministically create the route; create a default one
        await k8sCreate(RouteModel, createEventListenerRoute(elResource), { ns });
      }
      return;
    }

    // Get the service, find out what port we are exposed on
    const serviceResource = await k8sGet(ServiceModel, serviceGeneratedName, ns);
    const servicePort = serviceResource.spec?.ports?.[0]?.targetPort;

    // Build the exposed route on the correct port
    const route: RouteKind = createEventListenerRoute(
      elResource,
      serviceGeneratedName,
      servicePort,
    );
    await k8sCreate(RouteModel, route, { ns });
  } catch (e) {
    errorModal({
      title: 'Error Exposing Route',
      error: e.message || 'Unknown error exposing the Webhook route',
    });
  }
};

export const submitTrigger = async (
  pipeline: Pipeline,
  formValues: AddTriggerFormValues,
): Promise<K8sResourceKind[]> => {
  const { triggerBinding } = formValues;
  const thisNamespace = pipeline.metadata.namespace;

  const pipelineRun: PipelineRun = getPipelineRunFromForm(
    pipeline,
    formValues,
    {},
    { generateName: true },
  );
  const triggerTemplateParams: TriggerTemplateKindParam[] = triggerBinding.resource.spec.params.map(
    ({ name }) => ({ name } as TriggerTemplateKindParam),
  );
  const triggerTemplate: TriggerTemplateKind = createTriggerTemplate(
    pipeline,
    pipelineRun,
    triggerTemplateParams,
  );
  const eventListener: EventListenerKind = createEventListener(
    [triggerBinding.resource],
    triggerTemplate,
  );

  const metadata = { ns: thisNamespace };
  let resources: K8sResourceKind[];
  try {
    // Validates the modal contents, should be done first
    const ttResource = await k8sCreate(TriggerTemplateModel, triggerTemplate, metadata);

    // Creates the linkages and will provide the link to non-trigger resources created
    const elResource = await k8sCreate(EventListenerModel, eventListener, metadata);

    // Capture all related resources
    resources = [ttResource, elResource];
  } catch (e) {
    return Promise.reject(e);
  }

  exposeRoute(eventListener.metadata.name, thisNamespace);

  return Promise.resolve(resources);
};
