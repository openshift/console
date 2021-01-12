import * as _ from 'lodash';
import {
  K8sResourceKind,
  referenceFor,
  referenceForModel,
  ImagePullPolicy,
} from '@console/internal/module/k8s';
import { BuildStrategyType } from '@console/internal/components/build';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { hasIcon } from '@console/internal/components/catalog/catalog-item-icon';
import { ServiceModel } from '@console/knative-plugin';
import { Pipeline } from '@console/pipelines-plugin/src/utils/pipeline-augment';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { Resources, DeploymentData, GitReadableTypes } from '../import/import-types';
import { AppResources } from './edit-application-types';
import { RegistryType } from '../../utils/imagestream-utils';
import { getHealthChecksData } from '../health-checks/create-health-checks-probe-utils';
import { detectGitType } from '../import/import-validation-utils';

export enum CreateApplicationFlow {
  Git = 'Import from Git',
  Dockerfile = 'Import from Dockerfile',
  Container = 'Deploy Image',
}

export const getResourcesType = (resource: K8sResourceKind): Resources => {
  switch (resource.kind) {
    case DeploymentConfigModel.kind:
      return Resources.OpenShift;
    case DeploymentModel.kind:
      return Resources.Kubernetes;
    case referenceFor(resource) === referenceForModel(ServiceModel) ? ServiceModel.kind : '':
      return Resources.KnativeService;
    default:
      return null;
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

const checkIfTriggerExists = (
  triggers: { [key: string]: any }[],
  type: string,
  resourceKind?: string,
) => {
  return !!_.find(triggers, (trigger) => {
    if (resourceKind === DeploymentConfigModel.kind && type === 'ImageChange') {
      return trigger.type === type && trigger.imageChangeParams?.automatic;
    }
    return trigger.type === type;
  });
};

export const getGitDataFromBuildConfig = (buildConfig: K8sResourceKind) => {
  const url = buildConfig?.spec?.source?.git?.uri ?? '';
  const gitData = {
    url,
    type: detectGitType(url),
    ref: _.get(buildConfig, 'spec.source.git.ref', ''),
    dir: _.get(buildConfig, 'spec.source.contextDir', ''),
    showGitType: false,
    secret: _.get(buildConfig, 'spec.source.sourceSecret.name', ''),
    isUrlValidating: false,
  };
  return gitData;
};

const getGitDataFromPipeline = (pipeline: Pipeline) => {
  const params = pipeline?.spec?.params;
  const url = (params?.find((param) => param?.name === 'GIT_REPO')?.default ?? '') as string;
  const ref = params?.find((param) => param?.name === 'GIT_REVISION')?.default ?? '';
  const dir = params?.find((param) => param?.name === 'PATH_CONTEXT')?.default ?? '/';
  return {
    url,
    ref,
    dir,
    type: detectGitType(url),
    showGitType: false,
    secret: '',
    isUrlValidating: false,
  };
};

export const getRouteData = (route: K8sResourceKind, resource: K8sResourceKind) => {
  let routeData = {
    disable: !_.isEmpty(route),
    create: !_.isEmpty(route),
    targetPort: _.get(route, 'spec.port.targetPort', ''),
    unknownTargetPort: _.toString(route?.spec?.port?.targetPort?.split('-')?.[0]) || '',
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
      create:
        _.get(resource, 'metadata.labels["serving.knative.dev/visibility"]', '') !==
        'cluster-local',
      unknownTargetPort: _.toString(port),
      targetPort: _.toString(port),
    };
  }
  return routeData;
};

export const getBuildData = (buildConfig: K8sResourceKind, pipeline: Pipeline, gitType: string) => {
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
      webhook: checkIfTriggerExists(triggers, GitReadableTypes[gitType]),
      image: checkIfTriggerExists(triggers, 'ImageChange'),
      config: checkIfTriggerExists(triggers, 'ConfigChange'),
    },
    strategy:
      buildStrategyType ||
      (pipeline?.metadata?.labels?.['pipeline.openshift.io/strategy'] ===
      _.toLower(BuildStrategyType.Docker)
        ? BuildStrategyType.Docker
        : BuildStrategyType.Source),
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
  const deploymentData: DeploymentData = {
    env: [],
    replicas: 1,
    triggers: { image: true, config: true },
  };
  const container = resource.spec?.template?.spec?.containers?.[0];
  const env = container?.env ?? [];
  switch (getResourcesType(resource)) {
    case Resources.KnativeService:
      return {
        ...deploymentData,
        env,
        triggers: {
          image: container?.imagePullPolicy === ImagePullPolicy.Always,
        },
      };
    case Resources.OpenShift: {
      const triggers = resource.spec?.triggers;
      return {
        env,
        triggers: {
          image: checkIfTriggerExists(triggers, 'ImageChange', resource.kind),
          config: checkIfTriggerExists(triggers, 'ConfigChange'),
        },
        replicas: resource.spec?.replicas ?? 1,
      };
    }
    case Resources.Kubernetes: {
      const imageTrigger = JSON.parse(
        resource.metadata?.annotations?.['image.openshift.io/triggers'] ?? '[]',
      )?.[0];
      return {
        env,
        triggers: {
          image: imageTrigger?.pause === 'false',
        },
        replicas: resource.spec?.replicas ?? 1,
      };
    }
    default:
      return deploymentData;
  }
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
    'serving.knative.dev/visibility',
  ];
  const allLabels = _.get(resource, 'metadata.labels', {});
  const userLabels = _.omit(allLabels, defaultLabels);
  return userLabels;
};

export const getCommonInitialValues = (
  editAppResource: K8sResourceKind,
  route: K8sResourceKind,
  pipelineData: Pipeline,
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
      enabled: !_.isEmpty(pipelineData),
    },
    deployment: getDeploymentData(editAppResource),
    labels: getUserLabels(editAppResource),
    limits: getLimitsData(editAppResource),
    healthChecks: getHealthChecksData(editAppResource),
  };
  return commonInitialValues;
};

export const getIconInitialValues = (editAppResource: K8sResourceKind) => {
  const runtimeLabel = editAppResource?.metadata?.labels?.['app.openshift.io/runtime'];
  const runtimeIcon = runtimeLabel && hasIcon(runtimeLabel) ? runtimeLabel : null;
  return {
    runtimeIcon,
  };
};

export const getGitAndDockerfileInitialValues = (
  buildConfig: K8sResourceKind,
  pipeline: Pipeline,
) => {
  if (_.isEmpty(buildConfig) && _.isEmpty(pipeline)) {
    return {};
  }

  const currentImage = _.split(buildConfig?.spec?.strategy?.sourceStrategy?.from?.name ?? '', ':');
  const git = !_.isEmpty(buildConfig)
    ? getGitDataFromBuildConfig(buildConfig)
    : getGitDataFromPipeline(pipeline);
  const initialValues = {
    git,
    docker: {
      dockerfilePath:
        buildConfig?.spec?.strategy?.dockerStrategy?.dockerfilePath ||
        pipeline?.spec?.params?.find((param) => param?.name === 'DOCKERFILE')?.default ||
        'Dockerfile',
    },
    image: {
      selected:
        currentImage[0] || (pipeline?.metadata?.labels?.['pipeline.openshift.io/runtime'] ?? ''),
      recommended: '',
      tag: currentImage[1] || '',
      tagObj: {},
      ports: [],
      isRecommending: false,
      couldNotRecommend: false,
    },
    build: getBuildData(buildConfig, pipeline, git.type),
  };
  return initialValues;
};

const deployImageInitialValues = {
  searchTerm: '',
  registry: 'external',
  allowInsecureRegistry: false,
  imageStream: {
    image: '',
    tag: '',
    namespace: '',
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

export const getExternalImageInitialValues = (appResources: AppResources) => {
  const imageStreamList = appResources?.imageStream?.data;
  if (_.isEmpty(imageStreamList)) {
    return {};
  }
  const imageStream = _.orderBy(imageStreamList, ['metadata.resourceVersion'], ['desc']);
  const imageStreamData = imageStream?.[0]?.spec?.tags?.[0];
  const name = imageStreamData?.from?.name;
  const isAllowInsecureRegistry = imageStreamData?.importPolicy?.insecure || false;
  return {
    ...deployImageInitialValues,
    searchTerm: name,
    registry: 'external',
    allowInsecureRegistry: isAllowInsecureRegistry,
    imageStream: {
      ...deployImageInitialValues.imageStream,
    },
  };
};

export const getInternalImageInitialValues = (editAppResource: K8sResourceKind) => {
  const imageStreamNamespace = _.get(
    editAppResource,
    'metadata.labels["app.openshift.io/runtime-namespace"]',
    '',
  );
  const imageStreamName = _.get(editAppResource, 'metadata.labels["app.kubernetes.io/name"]', '');
  const imageStreamTag = _.get(
    editAppResource,
    'metadata.labels["app.openshift.io/runtime-version"]',
    '',
  );
  return {
    ...deployImageInitialValues,
    registry: RegistryType.Internal,
    imageStream: {
      image: imageStreamName,
      tag: imageStreamTag,
      namespace: imageStreamNamespace,
    },
  };
};

export const getExternalImagelValues = (appResource: K8sResourceKind) => {
  const name = _.get(appResource, 'spec.template.spec.containers[0].image', null);
  if (_.isEmpty(appResource) || !name) {
    return {};
  }
  return {
    ...deployImageInitialValues,
    searchTerm: name,
    registry: RegistryType.External,
    imageStream: {
      ...deployImageInitialValues.imageStream,
    },
  };
};

export const getInitialValues = (
  appResources: AppResources,
  appName: string,
  namespace: string,
) => {
  const editAppResourceData = appResources.editAppResource?.data;
  const routeData = appResources.route?.data;
  const buildConfigData = appResources.buildConfig?.data;
  const pipelineData = appResources.pipeline?.data;

  const commonValues = getCommonInitialValues(
    editAppResourceData,
    routeData,
    pipelineData,
    appName,
    namespace,
  );
  const gitDockerValues = getGitAndDockerfileInitialValues(buildConfigData, pipelineData);

  let iconValues = {};
  let externalImageValues = {};
  let internalImageValues = {};
  if (_.isEmpty(gitDockerValues)) {
    iconValues = getIconInitialValues(editAppResourceData);
    externalImageValues = getExternalImageInitialValues(appResources);
    internalImageValues = _.isEmpty(externalImageValues)
      ? getInternalImageInitialValues(editAppResourceData)
      : {};
    if (
      _.isEmpty(externalImageValues) &&
      !_.get(internalImageValues, 'imageStream.tag') &&
      !_.get(internalImageValues, 'imageStream.image')
    ) {
      if (editAppResourceData?.kind === ServiceModel.kind) {
        internalImageValues = {};
        externalImageValues = getExternalImagelValues(editAppResourceData);
      }
    }
  }

  return {
    ...commonValues,
    ...iconValues,
    ...gitDockerValues,
    ...externalImageValues,
    ...internalImageValues,
  };
};
