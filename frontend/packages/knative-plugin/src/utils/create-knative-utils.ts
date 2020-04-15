import * as _ from 'lodash';
import { K8sResourceKind, ImagePullPolicy } from '@console/internal/module/k8s';
import { getAppLabels, mergeData } from '@console/dev-console/src/utils/resource-label-utils';
import {
  DeployImageFormData,
  GitImportFormData,
} from '@console/dev-console/src/components/import/import-types';
import { ServiceModel } from '../models';

export const getKnativeServiceDepResource = (
  formData: GitImportFormData | DeployImageFormData,
  imageStreamUrl: string,
  imageStreamName?: string,
  imageStreamTag?: string,
  imageNamespace?: string,
  annotations?: { [name: string]: string },
  originalKnativeService?: K8sResourceKind,
): K8sResourceKind => {
  const {
    name,
    application: { name: applicationName },
    project: { name: namespace },
    serverless: { scaling },
    limits,
    route: { unknownTargetPort, create, targetPort },
    labels,
    image: { tag: imageTag },
    deployment: {
      env,
      triggers: { image: imagePolicy },
    },
  } = formData;
  const contTargetPort = targetPort
    ? parseInt(targetPort.split('-')[0], 10)
    : parseInt(unknownTargetPort, 10);
  const imgPullPolicy = imagePolicy ? ImagePullPolicy.Always : ImagePullPolicy.IfNotPresent;
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
  const defaultLabel = getAppLabels(
    name,
    applicationName,
    imageStreamName,
    imageStreamTag || imageTag,
    imageNamespace,
  );
  delete defaultLabel.app;
  const newKnativeDeployResource: K8sResourceKind = {
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
      annotations,
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
              imagePullPolicy: imgPullPolicy,
              env,
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

  let knativeServiceUpdated = {};
  if (!_.isEmpty(originalKnativeService)) {
    knativeServiceUpdated = _.omit(originalKnativeService, [
      'status',
      'spec.template.metadata.name',
    ]);
  }
  const knativeDeployResource = mergeData(knativeServiceUpdated || {}, newKnativeDeployResource);

  return knativeDeployResource;
};
