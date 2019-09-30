import * as _ from 'lodash';
import { K8sResourceKind, k8sCreate } from '@console/internal/module/k8s';
import { ServiceModel, RouteModel } from '@console/internal/models';
import { GitImportFormData, DeployImageFormData } from '../components/import/import-types';
import { getAppLabels, getPodLabels, getAppAnnotations } from './resource-label-utils';
import { makePortName } from './imagestream-utils';

export const annotations = {
  'openshift.io/generated-by': 'OpenShiftWebConsole',
};

export const dryRunOpt = { queryParams: { dryRun: 'All' } };

export const createService = (
  formData: DeployImageFormData | GitImportFormData,
  dryRun?: boolean,
  imageStreamData?: K8sResourceKind,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    labels: userLabels,
  } = formData;

  const imageStreamName = _.get(imageStreamData, 'metadata.name');
  const imageTag = _.get(formData, 'image.tag');
  const git = _.get(formData, 'git');
  const ports = _.get(formData, 'image.ports') || _.get(formData, 'isi.ports');

  const defaultLabels = getAppLabels(name, application, imageStreamName, imageTag);
  const podLabels = getPodLabels(name);
  const defaultAnnotations = git ? getAppAnnotations(git.url, git.ref) : annotations;

  const service = {
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
        name: makePortName(port),
      })),
    },
  };

  return k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {});
};

export const createRoute = (
  formData: GitImportFormData | DeployImageFormData,
  dryRun?: boolean,
  imageStreamData?: K8sResourceKind,
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    labels: userLabels,
    route: { hostname, secure, path, tls, targetPort: routeTargetPort },
  } = formData;

  const imageStreamName = _.get(imageStreamData, 'metadata.name');
  const imageTag = _.get(formData, 'image.tag');
  const git = _.get(formData, 'git');
  const ports = _.get(formData, 'image.ports') || _.get(formData, 'isi.ports');

  const defaultLabels = getAppLabels(name, application, imageStreamName, imageTag);
  const defaultAnnotations = git ? getAppAnnotations(git.url, git.ref) : annotations;

  let targetPort;
  if (_.get(formData, 'build.strategy') === 'Docker') {
    targetPort = makePortName({
      containerPort: _.toInteger(_.get(formData, 'docker.containerPort')),
      protocol: 'TCP',
    });
  } else {
    targetPort = routeTargetPort || makePortName(_.head(ports));
  }

  const route = {
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

  return k8sCreate(RouteModel, route, dryRun ? dryRunOpt : {});
};
