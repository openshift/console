import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  GitImportFormData,
  DeployImageFormData,
  UploadJarFormData,
} from '../components/import/import-types';
import { makePortName } from './imagestream-utils';
import {
  getAppLabels,
  getPodLabels,
  getGitAnnotations,
  getCommonAnnotations,
  mergeData,
} from './resource-label-utils';

export const dryRunOpt = { queryParams: { dryRun: 'All' } };

const isDeployImageFormData = (
  formData: DeployImageFormData | GitImportFormData | UploadJarFormData,
): formData is DeployImageFormData => {
  return 'isi' in (formData as DeployImageFormData);
};

export const createService = (
  formData: DeployImageFormData | GitImportFormData | UploadJarFormData,
  imageStreamData?: K8sResourceKind,
  originalService?: K8sResourceKind,
): K8sResourceKind => {
  const {
    project: { name: namespace },
    application: { name: applicationName },
    name,
    labels: userLabels,
    image: { ports: imagePorts, tag: selectedTag },
    route: { unknownTargetPort, defaultUnknownPort },
  } = formData;

  const imageStreamName = _.get(imageStreamData, 'metadata.name') || _.get(formData, 'image.name');
  const git = _.get(formData, 'git');

  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const podLabels = getPodLabels(name);
  const defaultAnnotations = git
    ? { ...getGitAnnotations(git.url, git.ref), ...getCommonAnnotations() }
    : getCommonAnnotations();

  let ports = imagePorts;
  const buildStrategy = formData.build?.strategy;
  if (buildStrategy === 'Docker' && unknownTargetPort) {
    const port = { containerPort: _.toInteger(unknownTargetPort), protocol: 'TCP' };
    ports = [port];
  } else if (buildStrategy === 'Devfile' && !_.isEmpty(originalService?.spec?.ports)) {
    ports = [
      ...originalService.spec.ports.map((port) => ({
        name: port.name,
        containerPort: port.port,
        protocol: 'TCP',
      })),
    ];
  } else if (isDeployImageFormData(formData)) {
    const {
      isi: { ports: isiPorts },
    } = formData;
    ports = isiPorts;
  } else if (_.isEmpty(ports)) {
    const port = { containerPort: defaultUnknownPort, protocol: 'TCP' };
    ports = [port];
  }
  if (
    unknownTargetPort &&
    !ports.some((port) => unknownTargetPort === port.containerPort.toString())
  ) {
    const port = { containerPort: _.toInteger(unknownTargetPort), protocol: 'TCP' };
    ports = [...ports, port];
  }

  const newService: any = {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: { ...defaultAnnotations },
    },
    spec: {
      selector: podLabels,
      ports: _.map(ports, (port) => ({
        port: port.containerPort,
        targetPort: port.containerPort,
        protocol: port.protocol,
        // Use the same naming convention as CLI new-app.
        name: port.name || makePortName(port),
      })),
    },
  };

  const service = mergeData(originalService, newService);

  return service;
};

export const createRoute = (
  formData: GitImportFormData | DeployImageFormData | UploadJarFormData,
  imageStreamData?: K8sResourceKind,
  originalRoute?: K8sResourceKind,
): K8sResourceKind => {
  const {
    project: { name: namespace },
    application: { name: applicationName },
    name,
    labels: userLabels,
    route: { hostname, unknownTargetPort, defaultUnknownPort, secure, path, tls },
    image: { ports: imagePorts, tag: selectedTag },
  } = formData;

  const imageStreamName = _.get(imageStreamData, 'metadata.name') || _.get(formData, 'image.name');
  const git = _.get(formData, 'git');

  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const defaultAnnotations = git
    ? { ...getGitAnnotations(git.url, git.ref), ...getCommonAnnotations() }
    : getCommonAnnotations();

  let ports = imagePorts;
  if (isDeployImageFormData(formData)) {
    const {
      isi: { ports: isiPorts },
    } = formData;
    ports = isiPorts;
  }

  let targetPort: string;
  const buildStrategy = formData.build?.strategy;
  if (buildStrategy === 'Docker' && unknownTargetPort) {
    targetPort = makePortName({
      containerPort: _.toInteger(unknownTargetPort),
      protocol: 'TCP',
    });
  } else if (buildStrategy === 'Devfile') {
    targetPort = originalRoute?.spec?.port?.targetPort;
  } else if (unknownTargetPort) {
    targetPort = makePortName({ containerPort: _.toInteger(unknownTargetPort), protocol: 'TCP' });
  } else {
    targetPort = makePortName({
      containerPort: ports[0]?.containerPort || defaultUnknownPort,
      protocol: 'TCP',
    });
  }

  const newRoute: any = {
    kind: 'Route',
    apiVersion: 'route.openshift.io/v1',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      defaultAnnotations,
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

  const route = mergeData(originalRoute, newRoute);

  return route;
};
