import * as _ from 'lodash';
import {
  ImageStreamModel,
  BuildConfigModel,
  DeploymentConfigModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind, ContainerPort } from '@console/internal/module/k8s';
import { makePortName } from './imagestream-utils';
import { getAppLabels, getPodLabels } from './resource-label-utils';

type ImageStream = {
  metadata: {
    name: string;
    namespace: string;
  };
};

export const createImageStream = (
  name: string,
  namespace: string,
  application: string,
  { metadata: { name: imageStreamName } }: ImageStream,
): Promise<K8sResourceKind> => {
  const labels = getAppLabels(name, application, imageStreamName);
  const imageStream = {
    apiVersion: 'image.openshift.io/v1',
    kind: 'ImageStream',
    metadata: {
      name,
      namespace,
      labels,
    },
  };

  return k8sCreate(ImageStreamModel, imageStream);
};

export const createBuildConfig = (
  name: string,
  namespace: string,
  application: string,
  repository: string,
  ref: string = 'master',
  contextDir: string,
  selectedTag: string,
  imageStream: ImageStream,
): Promise<K8sResourceKind> => {
  const labels = getAppLabels(name, application, imageStream.metadata.name);
  const buildConfig = {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      name,
      namespace,
      labels,
    },
    spec: {
      output: {
        to: {
          kind: 'ImageStreamTag',
          name: `${name}:latest`,
        },
      },
      source: {
        contextDir,
        git: {
          uri: repository,
          ref,
          type: 'Git',
        },
      },
      strategy: {
        type: 'Source',
        sourceStrategy: {
          from: {
            kind: 'ImageStreamTag',
            name: `${imageStream.metadata.name}:${selectedTag}`,
            namespace: imageStream.metadata.namespace,
          },
        },
      },
      triggers: [
        {
          type: 'ImageChange',
          imageChange: {},
        },
        {
          type: 'ConfigChange',
        },
      ],
    },
  };

  return k8sCreate(BuildConfigModel, buildConfig);
};

export const createDeploymentConfig = (
  name: string,
  namespace: string,
  application: string,
  ports: ContainerPort[],
  imageStream: ImageStream,
): Promise<K8sResourceKind> => {
  const labels = getAppLabels(name, application, imageStream.metadata.name);
  const podLabels = getPodLabels(name);
  const deploymentConfig = {
    apiVersion: 'apps.openshift.io/v1',
    kind: 'DeploymentConfig',
    metadata: {
      name,
      namespace,
      labels,
    },
    spec: {
      selector: podLabels,
      replicas: 1,
      template: {
        metadata: {
          labels: podLabels,
        },
        spec: {
          containers: [
            {
              name,
              image: `${name}:latest`,
              ports,
              env: [],
            },
          ],
        },
      },
      triggers: [
        {
          type: 'ImageChange',
          imageChangeParams: {
            automatic: true,
            containerNames: [name],
            from: {
              kind: 'ImageStreamTag',
              name: `${name}:latest`,
            },
          },
        },
        {
          type: 'ConfigChange',
        },
      ],
    },
  };

  return k8sCreate(DeploymentConfigModel, deploymentConfig);
};

export const createService = (
  name: string,
  namespace: string,
  application: string,
  ports: ContainerPort[],
  imageStream: ImageStream,
): Promise<K8sResourceKind> => {
  const firstPort = _.head(ports);
  const labels = getAppLabels(name, application, imageStream.metadata.name);
  const podLabels = getPodLabels(name);
  const service = {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace,
      labels,
    },
    spec: {
      selector: podLabels,
      ports: [
        {
          port: firstPort.containerPort,
          targetPort: firstPort.containerPort,
          protocol: firstPort.protocol,
          // Use the same naming convention as the CLI.
          name: makePortName(firstPort),
        },
      ],
    },
  };

  return k8sCreate(ServiceModel, service);
};

export const createRoute = (
  name: string,
  namespace: string,
  application: string,
  ports: ContainerPort[],
  imageStream: ImageStream,
): Promise<K8sResourceKind> => {
  const firstPort = _.head(ports);
  const labels = getAppLabels(name, application, imageStream.metadata.name);
  const route = {
    kind: 'Route',
    apiVersion: 'route.openshift.io/v1',
    metadata: {
      name,
      namespace,
      labels,
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

  return k8sCreate(RouteModel, route);
};
