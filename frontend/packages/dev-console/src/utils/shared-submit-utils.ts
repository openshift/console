import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { GitImportFormData, DeployImageFormData } from '../components/import/import-types';
import { getAppLabels, getPodLabels, getAppAnnotations } from './resource-label-utils';
import { makePortName } from './imagestream-utils';

export const annotations = {
  'openshift.io/generated-by': 'OpenShiftWebConsole',
};

export const dryRunOpt = { queryParams: { dryRun: 'All' } };

const isDeployImageFormData = (
  formData: DeployImageFormData | GitImportFormData,
): formData is DeployImageFormData => {
  return 'isi' in (formData as DeployImageFormData);
};

export const createService = (
  formData: DeployImageFormData | GitImportFormData,
  imageStreamData?: K8sResourceKind,
  originalService?: K8sResourceKind,
): K8sResourceKind => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    labels: userLabels,
    image: { ports: imagePorts, tag: imageTag },
  } = formData;

  const imageStreamName = _.get(imageStreamData, 'metadata.name') || _.get(formData, 'image.name');
  const git = _.get(formData, 'git');

  const defaultLabels = getAppLabels(name, application, imageStreamName, imageTag);
  const podLabels = getPodLabels(name);
  const defaultAnnotations = git ? getAppAnnotations(git.url, git.ref) : annotations;

  let ports = imagePorts;
  if (_.get(formData, 'build.strategy') === 'Docker') {
    const port = { containerPort: _.get(formData, 'docker.containerPort'), protocol: 'TCP' };
    ports = [port];
  } else if (isDeployImageFormData(formData)) {
    const {
      isi: { ports: isiPorts },
    } = formData;
    ports = isiPorts;
  }

  const service: any = {
    ...(originalService || {}),
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      ...(originalService ? originalService.metadata : {}),
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: { ...defaultAnnotations },
    },
    spec: {
      ...(originalService ? originalService.spec : {}),
      selector: podLabels,
      ports: _.map(ports, (port) => ({
        port: port.containerPort,
        targetPort: port.containerPort,
        protocol: port.protocol,
        // Use the same naming convention as CLI new-app.
        name: makePortName(port),
      })),
    },
  };

  return service;
};

export const createRoute = (
  formData: GitImportFormData | DeployImageFormData,
  imageStreamData?: K8sResourceKind,
  originalRoute?: K8sResourceKind,
): K8sResourceKind => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    labels: userLabels,
    route: { hostname, secure, path, tls, targetPort: routeTargetPort },
    image: { ports: imagePorts, tag: imageTag },
  } = formData;

  const imageStreamName = _.get(imageStreamData, 'metadata.name') || _.get(formData, 'image.name');
  const git = _.get(formData, 'git');

  const defaultLabels = getAppLabels(name, application, imageStreamName, imageTag);
  const defaultAnnotations = git ? getAppAnnotations(git.url, git.ref) : annotations;

  let ports = imagePorts;
  if (isDeployImageFormData(formData)) {
    const {
      isi: { ports: isiPorts },
    } = formData;
    ports = isiPorts;
  }

  let targetPort;
  if (_.get(formData, 'build.strategy') === 'Docker') {
    const port = _.get(formData, 'docker.containerPort');
    targetPort = makePortName({
      containerPort: _.toInteger(port),
      protocol: 'TCP',
    });
  } else {
    targetPort = routeTargetPort || makePortName(_.head(ports));
  }

  const route: any = {
    ...(originalRoute || {}),
    kind: 'Route',
    apiVersion: 'route.openshift.io/v1',
    metadata: {
      ...(originalRoute ? originalRoute.metadata : {}),
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      defaultAnnotations,
    },
    spec: {
      ...(originalRoute ? originalRoute.spec : {}),
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
  return route;
};
