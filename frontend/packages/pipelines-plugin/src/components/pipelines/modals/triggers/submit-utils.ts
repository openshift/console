import { RouteModel, ServiceModel } from '@console/internal/models';
import { errorModal } from '@console/internal/components/modals';
import { k8sCreate, k8sGet, K8sResourceKind, RouteKind } from '@console/internal/module/k8s';
import { EventListenerModel, TriggerModel, TriggerTemplateModel } from '../../../../models';
import { PipelineKind, PipelineRunKind } from '../../../../types';
import {
  EventListenerKind,
  TriggerTemplateKind,
  TriggerTemplateKindParam,
} from '../../resource-types';
import { getPipelineRunFromForm } from '../common/utils';
import {
  createEventListener,
  createEventListenerRoute,
  createEventListenerWithTrigger,
  createTrigger,
  createTriggerTemplate,
  dryRunTriggerResource,
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
  pipeline: PipelineKind,
  formValues: AddTriggerFormValues,
): Promise<K8sResourceKind[]> => {
  const { triggerBinding } = formValues;
  const thisNamespace = pipeline.metadata.namespace;

  const pipelineRun: PipelineRunKind = getPipelineRunFromForm(pipeline, formValues, null, null, {
    generateName: true,
  });
  const triggerTemplateParams: TriggerTemplateKindParam[] = triggerBinding.resource.spec.params.map(
    ({ name }) => ({ name } as TriggerTemplateKindParam),
  );
  const triggerTemplate: TriggerTemplateKind = createTriggerTemplate(
    pipeline,
    pipelineRun,
    triggerTemplateParams,
  );
  const metadata = { ns: thisNamespace };
  let resources: K8sResourceKind[];
  try {
    // try to dry run and see if see if the Trigger resource exists.
    const trigger = createTrigger(thisNamespace, triggerTemplate.metadata.name, [
      triggerBinding.resource,
    ]);
    // Validates the modal contents, should be done first
    const ttResource = await k8sCreate(TriggerTemplateModel, triggerTemplate, metadata);
    const triggerAvailable = await dryRunTriggerResource(trigger);

    if (triggerAvailable) {
      // Create  Trigger,TriggerTemplate and EventListener resources.
      const triggerResource = await k8sCreate(TriggerModel, trigger, metadata);

      const eventListener: EventListenerKind = createEventListenerWithTrigger(
        triggerResource.metadata.name,
      );
      const elResource = await k8sCreate(EventListenerModel, eventListener, metadata);
      // Capture all related resources
      resources = [triggerResource, ttResource, elResource];
    } else {
      // fallback to old flow
      const eventListener: EventListenerKind = await createEventListener(
        thisNamespace,
        [triggerBinding.resource],
        triggerTemplate,
      );
      // Creates the linkages and will provide the link to non-trigger resources created
      const elResource = await k8sCreate(EventListenerModel, eventListener, metadata);

      // Capture all related resources
      resources = [ttResource, elResource];
    }
  } catch (err) {
    return Promise.reject(err);
  }
  const {
    metadata: { name: elName },
  } = resources.find((r) => r.kind === EventListenerModel.kind);
  exposeRoute(elName, thisNamespace);

  return Promise.resolve(resources);
};
