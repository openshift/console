import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import {
  ServiceModel,
  RevisionModel,
  ConfigurationModel,
  RouteModel,
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
} from '@console/knative-plugin';
import { getAppLabels } from '@console/dev-console/src/utils/resource-label-utils';
import {
  DeployImageFormData,
  GitImportFormData,
} from '@console/dev-console/src/components/import/import-types';

export const getKnativeServiceDepResource = (
  formData: GitImportFormData | DeployImageFormData,
  imageStreamUrl: string,
  imageStreamName?: string,
  annotations?: { [name: string]: string },
): K8sResourceKind => {
  const {
    name,
    application: { name: applicationName },
    project: { name: namespace },
    serverless: { scaling },
    limits,
    route: { unknownTargetPort, create },
    labels,
    image: { tag: imageTag },
  } = formData;
  const contTargetPort: number = parseInt(unknownTargetPort, 10);
  const { concurrencylimit, concurrencytarget, minpods, maxpods } = scaling;
  const {
    cpu: {
      request: cpuRequest,
      requestUnit: cpuRequestUnit,
      limit: cpuLimit,
      limitUnit: cpuLimitUnit,
    },
    memory: {
      request: memoryRequest,
      requestUnit: memoryRequestUnit,
      limit: memoryLimit,
      limitUnit: memoryLimitUnit,
    },
  } = limits;
  const defaultLabel = getAppLabels(name, applicationName, imageStreamName, imageTag);
  delete defaultLabel.app;
  const knativeDeployResource: K8sResourceKind = {
    kind: ServiceModel.kind,
    apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
    metadata: {
      name,
      namespace,
      labels: {
        ...defaultLabel,
        ...labels,
        ...(!create && { 'serving.knative.dev/visibility': `cluster-local` }),
      },
    },
    spec: {
      template: {
        metadata: {
          labels: {
            ...defaultLabel,
            ...labels,
          },
          annotations: {
            ...(concurrencytarget && {
              'autoscaling.knative.dev/target': `${concurrencytarget}`,
            }),
            ...(minpods && { 'autoscaling.knative.dev/minScale': `${minpods}` }),
            ...(maxpods && { 'autoscaling.knative.dev/maxScale': `${maxpods}` }),
            ...annotations,
          },
        },
        spec: {
          ...(concurrencylimit && { containerConcurrency: concurrencylimit }),
          containers: [
            {
              image: `${imageStreamUrl}`,
              ...(contTargetPort && {
                ports: [
                  {
                    containerPort: contTargetPort,
                  },
                ],
              }),
              resources: {
                ...((cpuLimit || memoryLimit) && {
                  limits: {
                    ...(cpuLimit && { cpu: `${cpuLimit}${cpuLimitUnit}` }),
                    ...(memoryLimit && { memory: `${memoryLimit}${memoryLimitUnit}` }),
                  },
                }),
                ...((cpuRequest || memoryRequest) && {
                  requests: {
                    ...(cpuRequest && { cpu: `${cpuRequest}${cpuRequestUnit}` }),
                    ...(memoryRequest && { memory: `${memoryRequest}${memoryRequestUnit}` }),
                  },
                }),
              },
            },
          ],
        },
      },
    },
  };
  return knativeDeployResource;
};

export const knativeServingResourcesRevision = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(RevisionModel),
      namespace,
      prop: 'revisions',
      optional: true,
    },
  ];
  return knativeResource;
};

export const knativeServingResourcesConfigurations = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(ConfigurationModel),
      namespace,
      prop: 'configurations',
      optional: true,
    },
  ];
  return knativeResource;
};

export const knativeServingResourcesRoutes = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(RouteModel),
      namespace,
      prop: 'ksroutes',
      optional: true,
    },
  ];
  return knativeResource;
};

export const knativeServingResourcesServices = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(ServiceModel),
      namespace,
      prop: 'ksservices',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesCronJob = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceCronJobModel),
      namespace,
      prop: 'eventSourceCronjob',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesContainer = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceContainerModel),
      namespace,
      prop: 'eventSourceContainers',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesApiServer = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceApiServerModel),
      namespace,
      prop: 'eventSourceApiserver',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesCamel = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceCamelModel),
      namespace,
      prop: 'eventSourceCamel',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesKafka = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceKafkaModel),
      namespace,
      prop: 'eventSourceKafka',
      optional: true,
    },
  ];
  return knativeResource;
};
