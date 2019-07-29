import * as _ from 'lodash';
import {
  ImageStreamModel,
  BuildConfigModel,
  DeploymentConfigModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { createKnativeService } from '@console/knative-plugin/src/utils/create-knative-utils';
import { makePortName } from '../../utils/imagestream-utils';
import { getAppLabels, getPodLabels, getAppAnnotations } from '../../utils/resource-label-utils';
import { GitImportFormData } from './import-types';

const dryRunOpt = { queryParams: { dryRun: 'All' } };

export const createImageStream = (
  formData: GitImportFormData,
  imageStreamData: K8sResourceKind,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: application },
    labels: userLabels,
    git: { url: repository, ref },
  } = formData;
  const imageStreamName = imageStreamData && imageStreamData.metadata.name;
  const defaultLabels = getAppLabels(name, application, imageStreamName);
  const defaultAnnotations = getAppAnnotations(repository, ref);
  const imageStream = {
    apiVersion: 'image.openshift.io/v1',
    kind: 'ImageStream',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
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
    docker: { dockerfilePath },
    image: { tag: selectedTag },
    build: { env, triggers, strategy: buildStrategy },
    labels: userLabels,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const imageStreamNamespace = imageStream && imageStream.metadata.namespace;

  const defaultLabels = getAppLabels(name, application, imageStreamName);
  const defaultAnnotations = getAppAnnotations(repository, ref);
  let buildStrategyData;

  switch (buildStrategy) {
    case 'Docker':
      buildStrategyData = {
        dockerStrategy: { env, dockerfilePath },
      };
      break;
    default:
      buildStrategyData = {
        sourceStrategy: {
          env,
          from: {
            kind: 'ImageStreamTag',
            name: `${imageStreamName}:${selectedTag}`,
            namespace: imageStreamNamespace,
          },
        },
      };
      break;
  }

  const buildConfig = {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
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
        type: buildStrategy,
        ...buildStrategyData,
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
    limits: { cpu, memory },
    git: { url: repository, ref },
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels(name, application, imageStreamName);
  const defaultAnnotations = getAppAnnotations(repository, ref);
  const podLabels = getPodLabels(name);

  const deploymentConfig = {
    apiVersion: 'apps.openshift.io/v1',
    kind: 'DeploymentConfig',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
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
    route: { targetPort },
    docker: { containerPort },
    build: { strategy: buildStrategy },
    git: { url: repository, ref },
  } = formData;
  let port;
  if (buildStrategy === 'Docker') {
    port = { containerPort, protocol: 'TCP' };
  } else {
    port = ports.find((p) => targetPort === makePortName(p)) || _.head(ports);
  }

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels(name, application, imageStreamName);
  const defaultAnnotations = getAppAnnotations(repository, ref);
  const podLabels = getPodLabels(name);
  const service = {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
    },
    spec: {
      selector: podLabels,
      ports: [
        {
          port: port.containerPort,
          targetPort: port.containerPort,
          protocol: port.protocol,
          // Use the same naming convention as the CLI.
          name: makePortName(port),
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
    route: { hostname, secure, path, tls, targetPort: routeTargetPort },
    docker: { containerPort },
    build: { strategy: buildStrategy },
    git: { url: repository, ref },
  } = formData;

  let targetPort;
  if (buildStrategy === 'Docker') {
    targetPort = makePortName({ containerPort: _.toInteger(containerPort), protocol: 'TCP' });
  } else {
    targetPort = routeTargetPort || makePortName(_.head(ports));
  }

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels(name, application, imageStreamName);
  const defaultAnnotations = getAppAnnotations(repository, ref);
  const route = {
    kind: 'Route',
    apiVersion: 'route.openshift.io/v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
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
        targetPort,
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
    name,
    application: { name: applicationName },
    project: { name: projectName },
    route: { create: canCreateRoute },
    image: { ports },
    build: { strategy: buildStrategy },
    labels: userLabels,
    limits,
    serverless: { scaling },
    route,
    git: { url: repository, ref },
  } = formData;
  const imageStreamName = _.get(imageStream, 'metadata.name');

  const requests: Promise<K8sResourceKind>[] = [
    createImageStream(formData, imageStream, dryRun),
    createBuildConfig(formData, imageStream, dryRun),
  ];

  const defaultAnnotations = getAppAnnotations(repository, ref);

  if (formData.serverless.enabled) {
    // knative service doesn't have dry run capability so returning the promises.
    if (dryRun) {
      return Promise.all(requests);
    }

    const [imageStreamResponse] = await Promise.all(requests);
    return Promise.all([
      createKnativeService(
        name,
        applicationName,
        projectName,
        scaling,
        limits,
        route,
        userLabels,
        imageStreamResponse.status.dockerImageRepository,
        imageStreamName,
        defaultAnnotations,
      ),
    ]);
  }

  requests.push(createDeploymentConfig(formData, imageStream, dryRun));

  if (!_.isEmpty(ports) || buildStrategy === 'Docker') {
    requests.push(createService(formData, imageStream, dryRun));
    if (canCreateRoute) {
      requests.push(createRoute(formData, imageStream, dryRun));
    }
  }
  return Promise.all(requests);
};
