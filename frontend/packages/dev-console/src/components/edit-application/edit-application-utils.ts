import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { BuildStrategyType } from '@console/internal/components/build';
import { hasIcon } from '@console/internal/components/catalog/catalog-item-icon';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import {
  K8sResourceKind,
  referenceFor,
  referenceForModel,
  ImagePullPolicy,
} from '@console/internal/module/k8s';
import {
  KNATIVE_AUTOSCALEWINDOW_ANNOTATION,
  KNATIVE_CONCURRENCYTARGET_ANNOTATION,
  KNATIVE_CONCURRENCYUTILIZATION_ANNOTATION,
  KNATIVE_MAXSCALE_ANNOTATION,
  KNATIVE_MINSCALE_ANNOTATION,
  KNATIVE_SERVING_LABEL,
  ServiceModel,
} from '@console/knative-plugin';
import { isDockerPipeline } from '@console/pipelines-plugin/src/components/import/pipeline/pipeline-template-utils';
import {
  PIPELINE_RUNTIME_LABEL,
  PIPELINE_RUNTIME_VERSION_LABEL,
} from '@console/pipelines-plugin/src/const';
import { PipelineKind } from '@console/pipelines-plugin/src/types';
import { getLimitsDataFromResource } from '@console/shared/src';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { RegistryType } from '../../utils/imagestream-utils';
import { getHealthChecksData } from '../health-checks/create-health-checks-probe-utils';
import { deployValidationSchema } from '../import/deployImage-validation-utils';
import {
  Resources,
  DeploymentData,
  GitReadableTypes,
  ServerlessData,
} from '../import/import-types';
import {
  detectGitType,
  validationSchema as importValidationSchema,
} from '../import/import-validation-utils';
import { getAutoscaleWindow } from '../import/serverless/serverless-utils';
import { validationSchema as jarValidationSchema } from '../import/upload-jar-validation-utils';
import { AppResources } from './edit-application-types';

export enum ApplicationFlowType {
  Git = 'Import from Git',
  Dockerfile = 'Import from Dockerfile',
  Container = 'Deploy Image',
  JarUpload = 'Upload JAR file',
}

export const getFlowTypePageTitle = (flowType: ApplicationFlowType): string => {
  switch (flowType) {
    case ApplicationFlowType.Git:
      // t('devconsole~Import from Git')
      return 'devconsole~Import from Git';
    case ApplicationFlowType.Dockerfile:
      // t('devconsole~Import from Dockerfile')
      return 'devconsole~Import from Dockerfile';
    case ApplicationFlowType.Container:
      // t('devconsole~Deploy Image')
      return 'devconsole~Deploy Image';
    case ApplicationFlowType.JarUpload:
      // t('devconsole~Upload JAR file')
      return 'devconsole~Upload JAR file';
    default:
      return flowType;
  }
};

export enum BuildSourceType {
  Git = 'Git',
  Binary = 'Binary',
}

const isFromJarUpload = (type: string): boolean => type === BuildSourceType.Binary;

const getBuildSourceType = (buildConfig: K8sResourceKind): string =>
  buildConfig?.spec?.source?.type;

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

export const getFlowType = (buildStrategy: string, buildType?: string): ApplicationFlowType => {
  switch (buildStrategy) {
    case BuildStrategyType.Source:
      return buildType === BuildSourceType.Binary
        ? ApplicationFlowType.JarUpload
        : ApplicationFlowType.Git;
    case BuildStrategyType.Docker:
      return ApplicationFlowType.Dockerfile;
    default:
      return ApplicationFlowType.Container;
  }
};

export const getValidationSchema = (
  buildStrategy: string,
  buildType?: string,
): ((t: TFunction) => any) => {
  switch (buildStrategy) {
    case BuildStrategyType.Source:
      return buildType === BuildSourceType.Binary ? jarValidationSchema : importValidationSchema;
    case BuildStrategyType.Docker:
      return importValidationSchema;
    default:
      return deployValidationSchema;
  }
};

export const checkIfTriggerExists = (
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

const getGitDataFromPipeline = (pipeline: PipelineKind) => {
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

export const getKsvcRouteData = (resource: K8sResourceKind) => {
  const { metadata, spec } = resource;
  const containers = spec?.template?.spec?.containers ?? [];
  const port = containers?.[0]?.ports?.[0]?.containerPort ?? '';
  const routeData = {
    create: metadata?.labels?.[`${KNATIVE_SERVING_LABEL}/visibility`] !== 'cluster-local',
    unknownTargetPort: _.toString(port),
    targetPort: _.toString(port),
    defaultUnknownPort: 8080,
  };
  return routeData;
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
    routeData = {
      ...routeData,
      ...getKsvcRouteData(resource),
    };
  }
  return routeData;
};

export const getBuildData = (
  buildConfig: K8sResourceKind,
  pipeline: PipelineKind,
  gitType: string,
) => {
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
      (isDockerPipeline(pipeline) ? BuildStrategyType.Docker : BuildStrategyType.Source),
    source: { type: getBuildSourceType(buildConfig) },
  };
  return buildData;
};

export const getServerlessData = (resource: K8sResourceKind): ServerlessData => {
  let serverlessData: ServerlessData = {
    scaling: {
      minpods: '',
      maxpods: '',
      concurrencytarget: '',
      concurrencylimit: '',
      autoscale: {
        autoscalewindow: '',
        autoscalewindowUnit: 's',
        defaultAutoscalewindowUnit: 's',
      },
      concurrencyutilization: '',
    },
    domainMapping: [],
  };
  if (getResourcesType(resource) === Resources.KnativeService) {
    const {
      spec: {
        template: { metadata, spec },
      },
    } = resource;
    const annotations = metadata?.annotations;
    const autoscalewindowAnnotation = annotations?.[KNATIVE_AUTOSCALEWINDOW_ANNOTATION] || '';
    const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } = getAutoscaleWindow(
      autoscalewindowAnnotation,
    );
    serverlessData = {
      scaling: {
        minpods: annotations?.[KNATIVE_MINSCALE_ANNOTATION] || '',
        maxpods: annotations?.[KNATIVE_MAXSCALE_ANNOTATION] || '',
        concurrencytarget: annotations?.[KNATIVE_CONCURRENCYTARGET_ANNOTATION] || '',
        concurrencylimit: spec?.containerConcurrency || '',
        autoscale: {
          autoscalewindow,
          autoscalewindowUnit,
          defaultAutoscalewindowUnit,
        },
        concurrencyutilization: annotations?.[KNATIVE_CONCURRENCYUTILIZATION_ANNOTATION] || '',
      },
      domainMapping: [],
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
  const container = resource.spec?.template?.spec?.containers?.find((c) =>
    [resource.metadata.name, resource.metadata.labels?.['app.kubernetes.io/name']].includes(c.name),
  );
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

export const getUserLabels = (resource: K8sResourceKind) => {
  const defaultLabels = [
    'app',
    'app.kubernetes.io/instance',
    'app.openshift.io/runtime',
    'app.kubernetes.io/part-of',
    'app.openshift.io/runtime-version',
    'app.openshift.io/runtime-namespace',
    'networking.knative.dev/visibility',
  ];
  const allLabels = _.get(resource, 'metadata.labels', {});
  const userLabels = _.omit(allLabels, defaultLabels);
  return userLabels;
};

export const getCommonInitialValues = (
  editAppResource: K8sResourceKind,
  route: K8sResourceKind,
  pipelineData: PipelineKind,
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
    limits: getLimitsDataFromResource(editAppResource),
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
  pipeline: PipelineKind,
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
      selected: pipeline?.metadata?.labels?.[PIPELINE_RUNTIME_LABEL] || currentImage[0] || '',
      recommended: '',
      tag: pipeline?.metadata?.labels?.[PIPELINE_RUNTIME_VERSION_LABEL] || currentImage[1] || '',
      tagObj: {},
      ports: [],
      isRecommending: false,
      couldNotRecommend: false,
    },
    build: getBuildData(buildConfig, pipeline, git.type),
  };
  return initialValues;
};

export const deployImageInitialValues = {
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
  const imageStreamName = _.get(editAppResource, 'metadata.labels["app.openshift.io/runtime"]', '');
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
    return deployImageInitialValues;
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

export const getFileUploadValues = (resource: K8sResourceKind, buildConfig: K8sResourceKind) => {
  const resourceName = resource.metadata.name;
  const fileName = buildConfig.metadata?.annotations?.jarFileName ?? '';
  const javaArgs: string =
    resource.spec?.template?.spec?.containers
      ?.find((container) => container.name === resourceName)
      ?.env?.find((args) => args.name === 'JAVA_ARGS')?.value ?? '';
  return {
    fileUpload: {
      name: fileName,
      value: '',
      javaArgs,
    },
    ...getIconInitialValues(resource),
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
  let fileUploadValues = {};
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
  } else if (isFromJarUpload(getBuildSourceType(buildConfigData))) {
    fileUploadValues = getFileUploadValues(editAppResourceData, buildConfigData);
  }

  return {
    ...commonValues,
    ...iconValues,
    ...fileUploadValues,
    ...gitDockerValues,
    ...externalImageValues,
    ...internalImageValues,
  };
};
