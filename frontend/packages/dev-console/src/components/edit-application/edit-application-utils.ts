import * as _ from 'lodash';
import { ValidatedOptions } from '@patternfly/react-core';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { BuildStrategyType } from '@console/internal/components/build';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { ServiceModel } from '@console/knative-plugin';
import { Resources } from '../import/import-types';
import { UNASSIGNED_KEY } from '../import/app/ApplicationSelector';
import { AppResources } from './edit-application-types';

export enum CreateApplicationFlow {
  Git = 'Import from Git',
  Dockerfile = 'Import from Dockerfile',
  Container = 'Deploy Image',
}

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

export const getPageHeading = (buildStrategy: string): string => {
  switch (buildStrategy) {
    case BuildStrategyType.Source:
      return CreateApplicationFlow.Git;
    case BuildStrategyType.Docker:
      return CreateApplicationFlow.Dockerfile;
    default:
      return CreateApplicationFlow.Container;
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
    urlValidation: ValidatedOptions.default,
    isUrlValidating: false,
  };
  return gitData;
};

export const getRouteData = (route: K8sResourceKind, resource: K8sResourceKind) => {
  let routeData = {
    disable: !_.isEmpty(route),
    create: true,
    targetPort: _.get(route, 'spec.port.targetPort', ''),
    unknownTargetPort: '',
    defaultUnknownPort: 8080,
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
      disable:
        _.get(resource, 'metadata.labels["serving.knative.dev/visibility"]', '') !==
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
    env: buildStrategyData.env || [],
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
  let serverlessData = {
    scaling: {
      minpods: 0,
      maxpods: '',
      concurrencytarget: '',
      concurrencylimit: '',
    },
  };
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
    'app.openshift.io/runtime-namespace',
  ];
  const allLabels = _.get(resource, 'metadata.labels', {});
  const userLabels = _.omit(allLabels, defaultLabels);
  return userLabels;
};

export const getCommonInitialValues = (
  editAppResource: K8sResourceKind,
  route: K8sResourceKind,
  name: string,
  namespace: string,
) => {
  const appGroupName = _.get(editAppResource, 'metadata.labels["app.kubernetes.io/part-of"]');
  const commonInitialValues = {
    formType: 'edit',
    name,
    application: {
      name: appGroupName || '',
      selectedKey: appGroupName || UNASSIGNED_KEY,
    },
    project: {
      name: namespace,
    },
    route: getRouteData(route, editAppResource),
    resources: getResourcesType(editAppResource),
    serverless: getServerlessData(editAppResource),
    pipeline: {
      enabled: false,
    },
    deployment: getDeploymentData(editAppResource),
    labels: getUserLabels(editAppResource),
    limits: getLimitsData(editAppResource),
  };
  return commonInitialValues;
};

export const getGitAndDockerfileInitialValues = (
  buildConfig: K8sResourceKind,
  route: K8sResourceKind,
) => {
  if (_.isEmpty(buildConfig)) {
    return {};
  }
  const currentImage = _.split(
    _.get(buildConfig, 'spec.strategy.sourceStrategy.from.name', ''),
    ':',
  );
  const initialValues = {
    git: getGitData(buildConfig),
    docker: {
      dockerfilePath: _.get(
        buildConfig,
        'spec.strategy.dockerStrategy.dockerfilePath',
        'Dockerfile',
      ),
      containerPort: parseInt(_.split(_.get(route, 'spec.port.targetPort'), '-')[0], 10),
    },
    image: {
      selected: currentImage[0] || '',
      recommended: '',
      tag: currentImage[1] || '',
      tagObj: {},
      ports: [],
      isRecommending: false,
      couldNotRecommend: false,
    },
    build: getBuildData(buildConfig),
  };
  return initialValues;
};

export const getExternalImageInitialValues = (imageStream: K8sResourceKind) => {
  if (_.isEmpty(imageStream)) {
    return {};
  }
  const name = _.get(imageStream, 'spec.tags[0].from.name');
  const deployImageInitialValues = {
    searchTerm: name,
    registry: 'external',
    imageStream: {
      image: '',
      tag: '',
      namespace: '',
      grantAccess: true,
    },
    isi: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
    image: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
    build: {
      env: [],
      triggers: {},
      strategy: '',
    },
    isSearchingForImage: false,
  };
  return deployImageInitialValues;
};

export const getInternalImageInitialValues = (editAppResource: K8sResourceKind) => {
  const imageStreamNamespace = _.get(
    editAppResource,
    'metadata.labels["app.openshift.io/runtime-namespace"]',
    '',
  );
  const imageStreamName = _.get(editAppResource, 'metadata.labels["app.openshift.io/runtime"]', '');
  const imageStreamTag = _.get(
    editAppResource,
    'metadata.labels["app.openshift.io/runtime-version"]',
    '',
  );
  const deployImageInitialValues = {
    searchTerm: '',
    registry: 'internal',
    imageStream: {
      image: imageStreamName,
      tag: imageStreamTag,
      namespace: imageStreamNamespace,
    },
    isi: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
    image: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
    build: {
      env: [],
      triggers: {},
      strategy: '',
    },
    isSearchingForImage: false,
  };
  return deployImageInitialValues;
};

export const getInitialValues = (
  appResources: AppResources,
  appName: string,
  namespace: string,
) => {
  const commonValues = getCommonInitialValues(
    _.get(appResources, 'editAppResource.data'),
    _.get(appResources, 'route.data'),
    appName,
    namespace,
  );
  const gitDockerValues = getGitAndDockerfileInitialValues(
    _.get(appResources, 'buildConfig.data'),
    _.get(appResources, 'route.data'),
  );
  let externalImageValues = {};
  let internalImageValues = {};

  if (_.isEmpty(gitDockerValues)) {
    externalImageValues = getExternalImageInitialValues(_.get(appResources, 'imageStream.data'));
    internalImageValues = _.isEmpty(externalImageValues)
      ? getInternalImageInitialValues(_.get(appResources, 'editAppResource.data'))
      : {};
  }

  return {
    ...commonValues,
    ...gitDockerValues,
    ...externalImageValues,
    ...internalImageValues,
  };
};
