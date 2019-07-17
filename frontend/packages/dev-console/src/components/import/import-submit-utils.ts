import * as _ from 'lodash';
import {
  ImageStreamModel,
  BuildConfigModel,
  DeploymentConfigModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { makePortName } from '../../utils/imagestream-utils';
import { getAppLabels, getPodLabels } from '../../utils/resource-label-utils';
import { GitImportFormData } from './import-types';
import { createKnativeService } from '../../utils/create-knative-utils';

const dryRunOpt = { queryParams: { dryRun: 'All' } };

export const createImageStream = (
  formData: GitImportFormData,
  { metadata: { name: imageStreamName } }: K8sResourceKind,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: application },
    labels: userLabels,
  } = formData;
  const defaultLabels = getAppLabels(name, application, imageStreamName);
  const imageStream = {
    apiVersion: 'image.openshift.io/v1',
    kind: 'ImageStream',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
    },
  };

  return k8sCreate(ImageStreamModel, imageStream, dryRun ? dryRunOpt : {});
};

export const createBuildConfig = (
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: application },
    git: { url: repository, ref = 'master', dir: contextDir, secret: secretName },
    image: { tag: selectedTag },
    build: { env, triggers },
    labels: userLabels,
  } = formData;

  const defaultLabels = getAppLabels(name, application, imageStream.metadata.name);
  const buildConfig = {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
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
        ...(secretName ? { sourceSecret: { name: secretName } } : {}),
      },
      strategy: {
        type: 'Source',
        sourceStrategy: {
          env,
          from: {
            kind: 'ImageStreamTag',
            name: `${imageStream.metadata.name}:${selectedTag}`,
            namespace: imageStream.metadata.namespace,
          },
        },
      },
      triggers: [
        ...(triggers.image ? [{ type: 'ImageChange', imageChange: {} }] : []),
        ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
      ],
    },
  };

  return k8sCreate(BuildConfigModel, buildConfig, dryRun ? dryRunOpt : {});
};

export const createDeploymentConfig = (
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: application },
    image: { ports },
    deployment: { env, replicas, triggers },
    labels: userLabels,
  } = formData;

  const defaultLabels = getAppLabels(name, application, imageStream.metadata.name);
  const podLabels = getPodLabels(name);

  const deploymentConfig = {
    apiVersion: 'apps.openshift.io/v1',
    kind: 'DeploymentConfig',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
    },
    spec: {
      selector: podLabels,
      replicas,
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
              name: `${name}:latest`,
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
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: application },
    image: { ports },
    labels: userLabels,
  } = formData;

  const firstPort = _.head(ports);
  const defaultLabels = getAppLabels(name, application, imageStream.metadata.name);
  const podLabels = getPodLabels(name);
  const service = {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
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

  return k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {});
};

export const createRoute = (
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: application },
    image: { ports },
    labels: userLabels,
    route: { hostname, secure, path, tls },
  } = formData;

  const firstPort = _.head(ports);
  const defaultLabels = getAppLabels(name, application, imageStream.metadata.name);
  const route = {
    kind: 'Route',
    apiVersion: 'route.openshift.io/v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
    },
    spec: {
      to: {
        kind: 'Service',
        name,
      },
      ...(secure ? { tls } : {}),
      host: hostname,
      path,
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
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean = false,
): Promise<K8sResourceKind[]> => {
  const {
    application: { name: applicationName },
    project: { name: projectName },
    route: { create: canCreateRoute },
    image: { ports },
  } = formData;

  const requests: Promise<K8sResourceKind>[] = [
    createImageStream(formData, imageStream, dryRun),
    createBuildConfig(formData, imageStream, dryRun),
  ];

  if (formData.serverless.trigger) {
    // knative service doesn't have dry run capability so returning the promises.
    if (dryRun) {
      return Promise.all(requests);
    }

    const [imageStreamResponse] = await Promise.all(requests);
    return Promise.all([
      createKnativeService(
        applicationName,
        projectName,
        formData.serverless.scaling,
        imageStreamResponse.status.dockerImageRepository,
      ),
    ]);
  }

  requests.push(createDeploymentConfig(formData, imageStream, dryRun));

  if (!_.isEmpty(ports)) {
    requests.push(createService(formData, imageStream, dryRun));
    if (canCreateRoute) {
      requests.push(createRoute(formData, imageStream, dryRun));
    }
  }
  return Promise.all(requests);
};
