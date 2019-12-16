import * as _ from 'lodash';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { BuildStrategyType } from '@console/internal/components/build';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { ServiceModel } from '@console/knative-plugin';
import { Resources } from '../import/import-types';

export const getResourcesType = (resource: K8sResourceKind): string => {
  switch (resource.kind) {
    case DeploymentConfigModel.kind:
      return Resources.OpenShift;
    case DeploymentModel.kind:
      return Resources.Kubernetes;
    case referenceFor(resource) === referenceForModel(ServiceModel) ? ServiceModel.kind : '':
      return Resources.KnativeService;
    default:
      return '';
  }
};

const checkIfTriggerExists = (triggers: { [key: string]: string | {} }[], type: string) => {
  return !!_.find(triggers, (trigger) => {
    return trigger.type === type;
  });
};

export const getGitData = (buildConfig: K8sResourceKind) => {
  const gitData = {
    url: _.get(buildConfig, 'spec.source.git.uri', ''),
    type: _.get(buildConfig, 'spec.source.type', ''),
    ref: _.get(buildConfig, 'spec.source.git.ref', ''),
    dir: _.get(buildConfig, 'spec.source.contextDir', ''),
    showGitType: false,
    secret: _.get(buildConfig, 'spec.source.sourceSecret.name', ''),
    isUrlValidated: false,
    isUrlValidating: false,
  };
  return gitData;
};

export const getRouteData = (route: K8sResourceKind, resource: K8sResourceKind) => {
  let routeData = {
    show: _.isEmpty(route),
    create: true,
    targetPort: _.get(route, 'spec.port.targetPort', ''),
    unknownTargetPort: '',
    path: _.get(route, 'spec.path', ''),
    hostname: _.get(route, 'spec.host', ''),
    secure: _.has(route, 'spec.termination'),
    tls: {
      termination: _.get(route, 'spec.termination', ''),
      insecureEdgeTerminationPolicy: _.get(route, 'spec.insecureEdgeTerminationPolicy', ''),
      caCertificate: _.get(route, 'spec.caCertificate', ''),
      certificate: _.get(route, 'spec.certificate', ''),
      destinationCACertificate: _.get(route, 'spec.destinationCACertificate', ''),
      privateKey: _.get(route, 'spec.privateKey', ''),
    },
  };
  if (getResourcesType(resource) === Resources.KnativeService) {
    const containers = _.get(resource, 'spec.template.spec.containers', []);
    const port = _.get(containers[0], 'ports[0].containerPort', '');
    routeData = {
      ...routeData,
      show:
        _.get(resource, 'metadata.labels["serving.knative.dev/visibility"]', '') ===
        'cluster-local',
      unknownTargetPort: _.toString(port),
    };
  }
  return routeData;
};

export const getBuildData = (buildConfig: K8sResourceKind) => {
  const buildStrategyType = _.get(buildConfig, 'spec.strategy.type', '');
  let buildStrategyData;
  switch (buildStrategyType) {
    case BuildStrategyType.Source:
      buildStrategyData = _.get(buildConfig, 'spec.strategy.sourceStrategy');
      break;
    case BuildStrategyType.Docker:
      buildStrategyData = _.get(buildConfig, 'spec.strategy.dockerStrategy');
      break;
    default:
      buildStrategyData = { env: [] };
  }
  const triggers = _.get(buildConfig, 'spec.triggers');
  const buildData = {
    env: buildStrategyData.env,
    triggers: {
      webhook: checkIfTriggerExists(triggers, 'GitHub'),
      image: checkIfTriggerExists(triggers, 'ImageChange'),
      config: checkIfTriggerExists(triggers, 'ConfigChange'),
    },
    strategy: buildStrategyType,
  };
  return buildData;
};

export const getServerlessData = (resource: K8sResourceKind) => {
  let serverlessData = {};
  if (getResourcesType(resource) === Resources.KnativeService) {
    const annotations = _.get(resource, 'spec.template.metadata.annotations');
    serverlessData = {
      scaling: {
        minpods: _.get(annotations, 'autoscaling.knative.dev/minScale', 0),
        maxpods: _.get(annotations, 'autoscaling.knative.dev/maxScale', ''),
        concurrencytarget: _.get(annotations, 'autoscaling.knative.dev/target', ''),
        concurrencylimit: _.get(resource, 'spec.template.spec.containerConcurrency', ''),
      },
    };
  }
  return serverlessData;
};

export const getDeploymentData = (resource: K8sResourceKind) => {
  let deploymentData = { env: [], replicas: 1, triggers: { image: true, config: true } };
  if (getResourcesType(resource) !== Resources.KnativeService) {
    const containers = _.get(resource, 'spec.template.spec.containers', []);
    const triggers = _.get(resource, 'spec.triggers');
    deploymentData = {
      env: _.get(containers[0], 'env', []),
      triggers: {
        image: checkIfTriggerExists(triggers, 'ImageChange'),
        config: checkIfTriggerExists(triggers, 'ConfigChange'),
      },
      replicas: _.get(resource, 'spec.replicas', 1),
    };
  }
  return deploymentData;
};

export const getLimitsData = (resource: K8sResourceKind) => {
  const containers = _.get(resource, 'spec.template.spec.containers', []);
  const resourcesRegEx = /^[0-9]*|[a-zA-Z]*/g;
  const cpuLimit = _.get(containers[0], 'resources.limits.cpu', '').match(resourcesRegEx);
  const memoryLimit = _.get(containers[0], 'resources.limits.memory', '').match(resourcesRegEx);
  const cpuRequest = _.get(containers[0], 'resources.requests.cpu', '').match(resourcesRegEx);
  const memoryRequest = _.get(containers[0], 'resources.requests.memory', '').match(resourcesRegEx);
  const limitsData = {
    cpu: {
      request: cpuRequest[0],
      requestUnit: cpuRequest[1] || '',
      defaultRequestUnit: cpuRequest[1] || '',
      limit: cpuLimit[0],
      limitUnit: cpuLimit[1] || '',
      defaultLimitUnit: cpuLimit[1] || '',
    },
    memory: {
      request: memoryRequest[0],
      requestUnit: memoryRequest[1] || 'Mi',
      defaultRequestUnit: memoryRequest[1] || 'Mi',
      limit: memoryLimit[0],
      limitUnit: memoryLimit[1] || 'Mi',
      defaultLimitUnit: memoryLimit[1] || 'Mi',
    },
  };
  return limitsData;
};

export const getUserLabels = (resource: K8sResourceKind) => {
  const defaultLabels = [
    'app',
    'app.kubernetes.io/instance',
    'app.kubernetes.io/component',
    'app.kubernetes.io/name',
    'app.openshift.io/runtime',
    'app.kubernetes.io/part-of',
    'app.openshift.io/runtime-version',
  ];
  const allLabels = _.get(resource, 'metadata.labels', {});
  const userLabels = _.omit(allLabels, defaultLabels);
  return userLabels;
};
