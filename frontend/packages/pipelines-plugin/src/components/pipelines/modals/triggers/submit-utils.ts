import { errorModal } from '@console/internal/components/modals';
import { RouteModel, ServiceModel } from '@console/internal/models';
import { k8sCreate, k8sGet, K8sResourceKind, RouteKind } from '@console/internal/module/k8s';
import {
  ClusterTriggerBindingModel,
  EventListenerModel,
  TriggerTemplateModel,
} from '../../../../models';
import { PipelineKind, PipelineRunKind, TektonWorkspace } from '../../../../types';
import { VolumeTypes } from '../../const';
import {
  EventListenerKind,
  TriggerTemplateKind,
  TriggerTemplateKindParam,
} from '../../resource-types';
import { getPipelineOperatorVersion } from '../../utils/pipeline-operator';
import {
  convertPipelineToModalData,
  getDefaultVolumeClaimTemplate,
  getPipelineRunFromForm,
} from '../common/utils';
import {
  createEventListener,
  createEventListenerRoute,
  createTriggerTemplate,
} from './resource-utils';
import { AddTriggerFormValues } from './types';

export const exposeRoute = async (elName: string, ns: string, iteration = 0) => {
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
  const pipelineOperatorVersion = await getPipelineOperatorVersion(thisNamespace);
  const eventListener: EventListenerKind = createEventListener(
    [triggerBinding.resource],
    triggerTemplate,
    pipelineOperatorVersion,
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
  } catch (err) {
    return Promise.reject(err);
  }

  exposeRoute(eventListener.metadata.name, thisNamespace);

  return Promise.resolve(resources);
};

export const createTrigger = async (
  pipeline: PipelineKind,
  gitDetectedType: string,
): Promise<K8sResourceKind[]> => {
  const createdResources = [];
  const defaultTriggerBinding = gitDetectedType ? `${gitDetectedType}-push` : 'github-push';
  const clusterTriggerBinding = await k8sGet(ClusterTriggerBindingModel, defaultTriggerBinding);
  if (clusterTriggerBinding) {
    const triggerValues: AddTriggerFormValues = {
      ...convertPipelineToModalData(pipeline),
      workspaces: (pipeline.spec.workspaces || []).map((workspace: TektonWorkspace) => ({
        ...workspace,
        type: VolumeTypes.VolumeClaimTemplate,
        data: getDefaultVolumeClaimTemplate(pipeline?.metadata?.name),
      })),
      triggerBinding: {
        name: defaultTriggerBinding,
        resource: clusterTriggerBinding,
      },
    };
    const resources = await submitTrigger(pipeline, triggerValues);
    createdResources.push(...resources);
  }
  return Promise.resolve(createdResources);
};
