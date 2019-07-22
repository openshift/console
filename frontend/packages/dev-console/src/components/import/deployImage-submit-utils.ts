import * as _ from 'lodash';
import {
  DeploymentConfigModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { createKnativeService } from '@console/knative-plugin/src/utils/create-knative-utils';
import { makePortName } from '../../utils/imagestream-utils';
import { getAppLabels, getPodLabels } from '../../utils/resource-label-utils';
import { DeployImageFormData } from './import-types';

const annotations = {
  'openshift.io/generated-by': 'OpenShiftWebConsole',
};

const dryRunOpt = { queryParams: { dryRun: 'All' } };

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
  } = formData;

  const defaultLabels = getAppLabels(name, application);
  const labels = { ...defaultLabels, ...userLabels };

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
      selector: labels,
      template: {
        metadata: {
          labels,
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
              name: `${name}:${tag}`,
              namespace,
            },
          },
        },
        ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
      ],
    },
  };

  return k8sCreate(DeploymentConfigModel, deploymentConfig, dryRun ? dryRunOpt : {});
};

export const createService = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    isi: { ports },
    labels: userLabels,
  } = formData;

  const defaultLabels = getAppLabels(name, application);
  const podLabels = getPodLabels(name);
  const service = {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations,
    },
    spec: {
      selector: podLabels,
      ports: _.map(ports, (port) => ({
        port: port.containerPort,
        targetPort: port.containerPort,
        protocol: port.protocol,
        // Use the same naming convention as CLI new-app.
        name: `${port.containerPort}-${port.protocol}`.toLowerCase(),
      })),
    },
  };

  return k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {});
};

export const createRoute = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    isi: { ports },
    labels: userLabels,
  } = formData;

  const firstPort = _.head(ports);
  const defaultLabels = getAppLabels(name, application);
  const route = {
    kind: 'Route',
    apiVersion: 'route.openshift.io/v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations,
    },
    spec: {
      to: {
        kind: 'Service',
        name,
      },
      // The service created by `createService` uses the same port as the container port.
      port: {
        // Use the port name, not the number for targetPort. The router looks
        // at endpoints, not services, when resolving ports, so port numbers
        // will not resolve correctly if the service port and container port
        // numbers don't match.
        targetPort: makePortName(firstPort),
      },
      wildcardPolicy: 'None',
    },
  };

  return k8sCreate(RouteModel, route, dryRun ? dryRunOpt : {});
};

export const createResources = async (
  formData: DeployImageFormData,
  dryRun: boolean = false,
): Promise<K8sResourceKind[]> => {
  const {
    route: { create: canCreateRoute },
    project: { name: projectName },
    name,
    isi: { ports },
    serverless: { scaling },
    limits,
    route,
  } = formData;

  const requests: Promise<K8sResourceKind>[] = [];
  requests.push(createImageStream(formData, dryRun));
  if (!formData.serverless.trigger) {
    requests.push(createDeploymentConfig(formData, dryRun));

    if (!_.isEmpty(ports)) {
      requests.push(createService(formData, dryRun));
      if (canCreateRoute) {
        requests.push(createRoute(formData, dryRun));
      }
    }
  } else if (!dryRun) {
    // Do not run serverless call during the dry run.
    const [imageStreamResponse] = await Promise.all(requests);
    requests.push(
      createKnativeService(
        name,
        projectName,
        scaling,
        limits,
        route,
        imageStreamResponse.status.dockerImageRepository,
      ),
    );
  }

  return Promise.all(requests);
};
