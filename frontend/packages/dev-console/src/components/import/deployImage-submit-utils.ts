import * as _ from 'lodash';
import {
  DeploymentConfigModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import {
  getKnativeServiceDepResource,
  ServiceModel as KnServiceModel,
} from '@console/knative-plugin';
import { getAppLabels, getPodLabels } from '../../utils/resource-label-utils';
import {
  createRoute,
  createService,
  annotations,
  dryRunOpt,
} from '../../utils/shared-submit-utils';
import { registryType } from '../../utils/imagestream-utils';
import { DeployImageFormData } from './import-types';

export const createImageStream = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    isi: { name: isiName, tag },
    labels: userLabels,
  } = formData;
  const defaultLabels = getAppLabels(name, application);
  const imageStream = {
    apiVersion: 'image.openshift.io/v1',
    kind: 'ImageStream',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
    },
    spec: {
      tags: [
        {
          name: tag,
          annotations: {
            ...annotations,
            'openshift.io/imported-from': isiName,
          },
          from: {
            kind: 'DockerImage',
            name: `${isiName}`,
          },
          importPolicy: {},
        },
      ],
    },
  };

  return k8sCreate(ImageStreamModel, imageStream, dryRun ? dryRunOpt : {});
};

export const createDeploymentConfig = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    isi: { image, tag, ports },
    deployment: { env, replicas, triggers },
    labels: userLabels,
    limits: { cpu, memory },
    imageStream: { image: imgName, namespace: imgNamespace },
  } = formData;

  const defaultLabels = getAppLabels(name, application);
  const labels = { ...defaultLabels, ...userLabels };
  const podLabels = getPodLabels(name);

  const volumes = [];
  const volumeMounts = [];
  let volumeNumber = 0;
  _.each(_.get(image, ['dockerImageMetadata', 'Config', 'Volumes']), (value, path) => {
    volumeNumber++;
    const volumeName = `${name}-${volumeNumber}`;
    volumes.push({
      name: volumeName,
      emptyDir: {},
    });
    volumeMounts.push({
      name: volumeName,
      mountPath: path,
    });
  });

  const deploymentConfig = {
    kind: 'DeploymentConfig',
    apiVersion: 'apps.openshift.io/v1',
    metadata: {
      name,
      namespace,
      labels,
      annotations,
    },
    spec: {
      replicas,
      selector: podLabels,
      template: {
        metadata: {
          labels: { ...userLabels, ...podLabels },
          annotations,
        },
        spec: {
          volumes,
          containers: [
            {
              name,
              image: _.get(image, ['dockerImageMetadata', 'Config', 'Image']),
              ports,
              volumeMounts,
              env,
              resources: {
                ...((cpu.limit || memory.limit) && {
                  limits: {
                    ...(cpu.limit && { cpu: `${cpu.limit}${cpu.limitUnit}` }),
                    ...(memory.limit && { memory: `${memory.limit}${memory.limitUnit}` }),
                  },
                }),
                ...((cpu.request || memory.request) && {
                  requests: {
                    ...(cpu.request && { cpu: `${cpu.request}${cpu.requestUnit}` }),
                    ...(memory.request && { memory: `${memory.request}${memory.requestUnit}` }),
                  },
                }),
              },
            },
          ],
        },
      },
      triggers: [
        {
          type: 'ImageChange',
          imageChangeParams: {
            automatic: triggers.image,
            containerNames: [name],
            from: {
              kind: 'ImageStreamTag',
              name: `${imgName || name}:${tag}`,
              namespace: imgNamespace || namespace,
            },
          },
        },
        ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
      ],
    },
  };

  return k8sCreate(DeploymentConfigModel, deploymentConfig, dryRun ? dryRunOpt : {});
};

export const ensurePortExists = (formData: DeployImageFormData): DeployImageFormData => {
  const {
    isi: { ports },
    route: { defaultUnknownPort, unknownTargetPort },
  } = formData;

  let values = formData;
  if (!Array.isArray(ports) || ports.length === 0) {
    // If we lack pre-defined ports but they have specified a custom target port, use that instead
    const containerPort = unknownTargetPort ? parseInt(unknownTargetPort, 10) : defaultUnknownPort;
    const suppliedPorts = [{ containerPort, protocol: 'TCP' }];

    values = {
      ...values,
      isi: {
        ...values.isi,
        ports: suppliedPorts,
      },
    };
  }

  return values;
};

export const createResources = async (
  rawFormData: DeployImageFormData,
  dryRun: boolean = false,
): Promise<K8sResourceKind[]> => {
  const formData = ensurePortExists(rawFormData);
  const {
    registry,
    route: { create: canCreateRoute },
    isi: { ports, tag: imageStreamTag },
  } = formData;

  const requests: Promise<K8sResourceKind>[] = [];
  registry === registryType.External && requests.push(createImageStream(formData, dryRun));
  if (!formData.serverless.enabled) {
    requests.push(createDeploymentConfig(formData, dryRun));

    if (!_.isEmpty(ports)) {
      const service = createService(formData);
      requests.push(k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {}));
      if (canCreateRoute) {
        const route = createRoute(formData);
        requests.push(k8sCreate(RouteModel, route, dryRun ? dryRunOpt : {}));
      }
    }
  } else if (!dryRun) {
    // Do not run serverless call during the dry run.
    const [imageStreamResponse] = await Promise.all(requests);
    const imageStreamUrl = imageStreamTag
      ? `${imageStreamResponse.status.dockerImageRepository}:${imageStreamTag}`
      : imageStreamResponse.status.dockerImageRepository;
    const knDeploymentResource = getKnativeServiceDepResource(formData, imageStreamUrl);
    requests.push(k8sCreate(KnServiceModel, knDeploymentResource));
  }

  return Promise.all(requests);
};
