import * as _ from 'lodash';
import { getProbesData } from '@console/dev-console/src/components/health-checks/create-health-checks-probe-utils';
import {
  DeployImageFormData,
  GitImportFormData,
  UploadJarFormData,
} from '@console/dev-console/src/components/import/import-types';
import { getAppLabels, mergeData } from '@console/dev-console/src/utils/resource-label-utils';
import { K8sResourceKind, ImagePullPolicy } from '@console/internal/module/k8s';
import { NameValuePair } from 'packages/console-shared/src';
import { ServiceModel } from '../models';

export const getKnativeServiceDepResource = (
  formData: GitImportFormData | DeployImageFormData | UploadJarFormData,
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
    runtimeIcon,
    serverless: { scaling },
    limits,
    route: { unknownTargetPort, create, defaultUnknownPort },
    labels,
    image: { tag: imageTag },
    deployment: {
      env,
      triggers: { image: imagePolicy },
    },
    healthChecks,
    resources,
  } = formData;
  const { fileUpload } = formData as UploadJarFormData;
  const contTargetPort = parseInt(unknownTargetPort, 10) || defaultUnknownPort;
  const imgPullPolicy = imagePolicy ? ImagePullPolicy.Always : ImagePullPolicy.IfNotPresent;
  const {
    concurrencylimit,
    concurrencytarget,
    minpods,
    maxpods,
    autoscale: { autoscalewindow, autoscalewindowUnit },
    concurrencyutilization,
  } = scaling;
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
  const defaultLabel = getAppLabels({
    name,
    applicationName,
    imageStreamName,
    selectedTag: imageStreamTag || imageTag,
    namespace: imageNamespace,
    runtimeIcon,
  });
  delete defaultLabel.app;
  if (fileUpload) {
    const jArgsIndex = env?.findIndex((e) => e.name === 'JAVA_ARGS');
    if (jArgsIndex !== -1) {
      if (fileUpload.javaArgs !== '') {
        (env[jArgsIndex] as NameValuePair).value = fileUpload.javaArgs;
      } else {
        env.splice(jArgsIndex, 1);
      }
    } else if (fileUpload.javaArgs !== '') {
      env.push({ name: 'JAVA_ARGS', value: fileUpload.javaArgs });
    }
  }
  const newKnativeDeployResource: K8sResourceKind = {
    kind: ServiceModel.kind,
    apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
    metadata: {
      name,
      namespace,
      labels: {
        ...defaultLabel,
        ...labels,
        ...(!create && { 'networking.knative.dev/visibility': `cluster-local` }),
        ...((formData as GitImportFormData).pipeline?.enabled && {
          'app.kubernetes.io/name': name,
        }),
      },
      annotations: fileUpload ? { ...annotations, jarFileName: fileUpload.name } : annotations,
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
            ...(autoscalewindow && {
              'autoscaling.knative.dev/window': `${autoscalewindow}${autoscalewindowUnit}`,
            }),
            ...(concurrencyutilization && {
              'autoscaling.knative.dev/targetUtilizationPercentage': `${concurrencyutilization}`,
            }),
          },
        },
        spec: {
          ...(concurrencylimit && { containerConcurrency: concurrencylimit }),
          containers: [
            {
              name,
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
              ...getProbesData(healthChecks, resources),
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
