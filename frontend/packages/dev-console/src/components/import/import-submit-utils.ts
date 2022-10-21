import * as GitUrlParse from 'git-url-parse';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { Perspective } from '@console/dynamic-plugin-sdk';
import { GitProvider } from '@console/git-service/src';
import { BuildStrategyType } from '@console/internal/components/build';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { history } from '@console/internal/components/utils';
import {
  ImageStreamModel,
  BuildConfigModel,
  DeploymentModel,
  DeploymentConfigModel,
  ProjectRequestModel,
  SecretModel,
  ServiceModel,
  ServiceAccountModel,
  RouteModel,
} from '@console/internal/models';
import {
  k8sCreate,
  k8sGet,
  K8sResourceKind,
  k8sUpdate,
  K8sVerb,
} from '@console/internal/module/k8s';
import { ServiceModel as KnServiceModel } from '@console/knative-plugin';
import {
  getDomainMappingRequests,
  getKnativeServiceDepResource,
} from '@console/knative-plugin/src/utils/create-knative-utils';
import {
  createPipelineForImportFlow,
  createPipelineRunForImportFlow,
  updatePipelineForImportFlow,
} from '@console/pipelines-plugin/src/components/import/pipeline/pipeline-template-utils';
import { PIPELINE_SERVICE_ACCOUNT } from '@console/pipelines-plugin/src/components/pipelines/const';
import { createTrigger } from '@console/pipelines-plugin/src/components/pipelines/modals/triggers/submit-utils';
import { setPipelineNotStarted } from '@console/pipelines-plugin/src/components/pipelines/pipeline-overview/pipeline-overview-utils';
import { PipelineKind } from '@console/pipelines-plugin/src/types';
import {
  updateServiceAccount,
  getSecretAnnotations,
} from '@console/pipelines-plugin/src/utils/pipeline-utils';
import { LimitsData } from '@console/shared/src/types';
import { getRandomChars, getResourceLimitsData } from '@console/shared/src/utils';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import {
  getAppLabels,
  getPodLabels,
  getGitAnnotations,
  getCommonAnnotations,
  getTriggerAnnotation,
  mergeData,
  getTemplateLabels,
  getRouteAnnotations,
} from '../../utils/resource-label-utils';
import { createService, createRoute, dryRunOpt } from '../../utils/shared-submit-utils';
import { AppResources } from '../edit-application/edit-application-types';
import { getProbesData } from '../health-checks/create-health-checks-probe-utils';
import {
  GitImportFormData,
  ProjectData,
  GitReadableTypes,
  Resources,
  DevfileSuggestedResources,
  UploadJarFormData,
  RouteData,
  ServerlessData,
  DeploymentData,
} from './import-types';

export const generateSecret = () => {
  // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + s4() + s4() + s4();
};

export const createProject = (projectData: ProjectData): Promise<K8sResourceKind> => {
  const project = {
    metadata: {
      name: projectData.name,
    },
    displayName: projectData.displayName,
    description: projectData.description,
  };

  return k8sCreate(ProjectRequestModel, project);
};

export const createOrUpdateImageStream = (
  formData: GitImportFormData | UploadJarFormData,
  imageStreamData: K8sResourceKind,
  dryRun: boolean,
  appResources: AppResources,
  verb: K8sVerb = 'create',
  generatedImageStreamName: string = '',
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: applicationName },
    labels: userLabels,
    image: { tag: selectedTag },
    labels,
  } = formData;
  const NAME_LABEL = 'app.kubernetes.io/name';
  const repository = (formData as GitImportFormData).git?.url;
  const ref = (formData as GitImportFormData).git?.ref;
  const imageStreamList = appResources?.imageStream?.data?.filter(
    (imgstr) => imgstr.metadata?.labels?.[NAME_LABEL] === (labels[NAME_LABEL] || name),
  );
  const imageStreamFilterData = _.orderBy(imageStreamList, ['metadata.resourceVersion'], ['desc']);
  const originalImageStream = (imageStreamFilterData.length && imageStreamFilterData[0]) || {};
  const imageStreamName = imageStreamData && imageStreamData.metadata.name;
  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const defaultAnnotations = {
    ...(repository && getGitAnnotations(repository, ref)),
    ...getCommonAnnotations(),
  };
  const imgStreamName =
    verb === 'update' && !_.isEmpty(originalImageStream)
      ? originalImageStream.metadata.labels[NAME_LABEL]
      : name;
  const newImageStream = {
    apiVersion: 'image.openshift.io/v1',
    kind: 'ImageStream',
    metadata: {
      name: generatedImageStreamName || imgStreamName,
      namespace,
      labels: {
        ...defaultLabels,
        ...userLabels,
        [NAME_LABEL]: imgStreamName,
      },
      annotations: defaultAnnotations,
    },
  };
  const imageStream = mergeData(originalImageStream, newImageStream);
  if (verb === 'update') {
    imageStream.metadata.name = originalImageStream.metadata.name;
  }
  return verb === 'update'
    ? k8sUpdate(ImageStreamModel, imageStream)
    : k8sCreate(ImageStreamModel, newImageStream, dryRun ? dryRunOpt : {});
};

export const createWebhookSecret = (
  formData: GitImportFormData | UploadJarFormData,
  imageStream: K8sResourceKind,
  secretType: string,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    application: { name: applicationName },
    project: { name: namespace },
    image: { tag: selectedTag },
    labels: userLabels,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });

  const webhookSecret = {
    apiVersion: 'v1',
    data: {},
    kind: 'Secret',
    metadata: {
      name: `${name}-${secretType}-webhook-secret`,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
    },
    stringData: { WebHookSecretKey: generateSecret() },
    type: SecretType.opaque,
  };

  return k8sCreate(SecretModel, webhookSecret, dryRun ? dryRunOpt : {});
};

export const createOrUpdateBuildConfig = (
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
  originalBuildConfig?: K8sResourceKind,
  verb: K8sVerb = 'create',
  generatedImageStreamName: string = '',
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: applicationName },
    git: { url: repository, type: gitType, ref = 'master', dir: contextDir, secret: secretName },
    docker: { dockerfilePath },
    image: { tag: selectedTag, imageEnv },
    build: { env, triggers, strategy: buildStrategy },
    labels: userLabels,
  } = formData;
  const NAME_LABEL = 'app.kubernetes.io/name';
  const imageStreamName = imageStream && imageStream.metadata.name;
  const imageStreamNamespace = imageStream && imageStream.metadata.namespace;

  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const defaultAnnotations = { ...getGitAnnotations(repository, ref), ...getCommonAnnotations() };
  let buildStrategyData;

  let desiredContextDir = contextDir;
  const imageEnvKeys = imageEnv ? Object.keys(imageEnv) : [];
  const customEnvs = imageEnvKeys
    .filter((k) => !!imageEnv[k])
    .map((k) => ({ name: k, value: imageEnv[k] }));
  const buildEnvs = env.filter((buildEnv) => !imageEnvKeys.includes(buildEnv.name));

  switch (buildStrategy) {
    case 'Devfile':
      buildStrategyData = originalBuildConfig?.spec?.strategy || {
        dockerStrategy: { env, dockerfilePath },
      };
      desiredContextDir = originalBuildConfig?.spec?.source?.contextDir || contextDir;
      break;
    case 'Docker':
      buildStrategyData = {
        dockerStrategy: { env, dockerfilePath },
      };
      break;
    default:
      buildStrategyData = {
        sourceStrategy: {
          env: [...customEnvs, ...buildEnvs],
          from: {
            kind: 'ImageStreamTag',
            name: `${imageStreamName}:${selectedTag}`,
            namespace: imageStreamNamespace,
          },
        },
      };
      break;
  }

  const webhookTriggerData = {
    type: GitReadableTypes[gitType],
    [gitType]: {
      secretReference: { name: `${name}-${gitType}-webhook-secret` },
    },
  };

  const buildConfigName =
    verb === 'update' && !_.isEmpty(originalBuildConfig)
      ? originalBuildConfig.metadata.labels[NAME_LABEL]
      : name;

  const newBuildConfig = {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      name: generatedImageStreamName || buildConfigName,
      namespace,
      labels: { ...defaultLabels, ...userLabels, [NAME_LABEL]: buildConfigName },
      annotations: defaultAnnotations,
    },
    spec: {
      output: {
        to: {
          kind: 'ImageStreamTag',
          name: `${generatedImageStreamName || buildConfigName}:latest`,
        },
      },
      source: {
        contextDir: desiredContextDir,
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
        {
          type: 'Generic',
          generic: {
            secretReference: { name: `${name}-generic-webhook-secret` },
          },
        },
        ...(triggers.webhook && gitType !== GitProvider.UNSURE ? [webhookTriggerData] : []),
        ...(triggers.image ? [{ type: 'ImageChange', imageChange: {} }] : []),
        ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
      ],
    },
  };

  const buildConfig = mergeData(originalBuildConfig, newBuildConfig);
  if (verb === 'update') {
    buildConfig.metadata.name = originalBuildConfig.metadata.name;
  }
  return verb === 'update'
    ? k8sUpdate(BuildConfigModel, buildConfig)
    : k8sCreate(BuildConfigModel, newBuildConfig, dryRun ? dryRunOpt : {});
};

export const createOrUpdateDeployment = (
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
  originalDeployment?: K8sResourceKind,
  verb: K8sVerb = 'create',
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: applicationName },
    image: { ports, tag: selectedTag },
    deployment: {
      env,
      replicas,
      triggers: { image: imageChange },
    },
    labels: userLabels,
    limits: { cpu, memory },
    git: { url: repository, ref },
    healthChecks,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const imageName = name;
  const defaultAnnotations = {
    ...getCommonAnnotations(),
    ...getGitAnnotations(repository, ref),
    ...getRouteAnnotations(),
    'alpha.image.policy.openshift.io/resolve-names': '*',
    ...getTriggerAnnotation(name, imageName, namespace, imageChange),
  };
  const podLabels = getPodLabels(Resources.Kubernetes, name);
  const templateLabels = getTemplateLabels(originalDeployment);

  const newDeployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
    },
    spec: {
      selector: {
        matchLabels: {
          app: name,
        },
      },
      replicas,
      template: {
        metadata: {
          labels: { ...templateLabels, ...userLabels, ...podLabels },
        },
        spec: {
          containers: [
            {
              name,
              image: `${name}:latest`,
              ports,
              env,
              resources: getResourceLimitsData({ cpu, memory }),
              ...getProbesData(healthChecks),
            },
          ],
        },
      },
    },
  };
  const deployment = mergeData(originalDeployment, newDeployment);

  return verb === 'update'
    ? k8sUpdate(DeploymentModel, deployment)
    : k8sCreate(DeploymentModel, deployment, dryRun ? dryRunOpt : {});
};

export const createOrUpdateDeploymentConfig = (
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
  originalDeploymentConfig?: K8sResourceKind,
  verb: K8sVerb = 'create',
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: applicationName },
    image: { ports, tag: selectedTag },
    deployment: { env, replicas, triggers },
    labels: userLabels,
    limits: { cpu, memory },
    git: { url: repository, ref },
    healthChecks,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const defaultAnnotations = {
    ...getCommonAnnotations(),
    ...getGitAnnotations(repository, ref),
    ...getRouteAnnotations(),
  };
  const podLabels = getPodLabels(Resources.OpenShift, name);
  const templateLabels = getTemplateLabels(originalDeploymentConfig);

  const newDeploymentConfig = {
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
          labels: { ...templateLabels, ...userLabels, ...podLabels },
        },
        spec: {
          containers: [
            {
              name,
              image: `${name}:latest`,
              ports,
              env,
              resources: getResourceLimitsData({ cpu, memory }),
              ...getProbesData(healthChecks),
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
  const deploymentConfig = mergeData(originalDeploymentConfig, newDeploymentConfig);

  return verb === 'update'
    ? k8sUpdate(DeploymentConfigModel, deploymentConfig)
    : k8sCreate(DeploymentConfigModel, deploymentConfig, dryRun ? dryRunOpt : {});
};

export const managePipelineResources = async (
  formData: GitImportFormData,
  pipelineData: PipelineKind,
): Promise<K8sResourceKind[]> => {
  const pipelineResources = [];
  if (!formData) return Promise.resolve([]);

  const { name, git, pipeline, project, docker, image } = formData;
  let managedPipeline: PipelineKind;
  const pipelineName = pipelineData?.metadata?.name;

  if (!_.isEmpty(pipelineData) && pipelineName === name) {
    managedPipeline = await updatePipelineForImportFlow(
      pipelineData,
      pipeline.template,
      name,
      project.name,
      git.url,
      git.ref,
      git.dir,
      docker.dockerfilePath,
      image.tag,
    );
  } else if (pipeline.template) {
    managedPipeline = await createPipelineForImportFlow(
      name,
      project.name,
      git.url,
      git.ref,
      git.dir,
      pipeline,
      docker.dockerfilePath,
      image.tag,
    );
    pipelineResources.push(managedPipeline);
    try {
      const triggerResources = await createTrigger(managedPipeline, git.detectedType);
      pipelineResources.push(...triggerResources);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error occured while creating triggers', error);
    }
  }

  if (git.secret) {
    const secret = await k8sGet(SecretModel, git.secret, project.name);
    const gitUrl = GitUrlParse(git.url);
    secret.metadata.annotations = getSecretAnnotations(
      {
        key: 'git',
        value:
          gitUrl.protocol === 'ssh' ? gitUrl.resource : `${gitUrl.protocol}://${gitUrl.resource}`,
      },
      secret.metadata.annotations,
    );
    await k8sUpdate(SecretModel, secret, project.name);

    const pipelineServiceAccount = await k8sGet(
      ServiceAccountModel,
      PIPELINE_SERVICE_ACCOUNT,
      project.name,
    );
    if (_.find(pipelineServiceAccount.secrets, (s) => s.name === git.secret) === undefined) {
      await updateServiceAccount(git.secret, pipelineServiceAccount, false);
    }
  }

  if (_.has(managedPipeline?.metadata?.labels, 'app.kubernetes.io/instance')) {
    try {
      const pipelineRun = await createPipelineRunForImportFlow(managedPipeline);
      pipelineResources.push(pipelineRun);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Failed to create PipelineRun for import flow', error);
      setPipelineNotStarted(managedPipeline.metadata.name, managedPipeline.metadata.namespace);
    }
  }
  return Promise.all(pipelineResources);
};

export const createDevfileResources = async (
  formData: GitImportFormData,
  dryRun: boolean,
  appResources: AppResources,
  generatedImageStreamName: string = '',
): Promise<K8sResourceKind[]> => {
  const verb: K8sVerb = 'create';

  const {
    name,
    project: { name: namespace },
    devfile: { devfileSuggestedResources },
  } = formData;

  const devfileResourceObjects: DevfileSuggestedResources = Object.keys(
    devfileSuggestedResources,
  ).reduce((acc: DevfileSuggestedResources, resourceType: string) => {
    const resource: K8sResourceKind = devfileSuggestedResources[resourceType];
    if (!resource) {
      return acc;
    }
    return {
      ...acc,
      [resourceType]: {
        ...resource,
        metadata: {
          ...resource.metadata,
          annotations: {
            ...resource.metadata?.annotations,
            isFromDevfile: 'true',
          },
          name,
          namespace,
          labels: {
            ...resource.metadata?.labels,
          },
        },
      },
    };
  }, {} as DevfileSuggestedResources);

  const imageStreamResponse = await createOrUpdateImageStream(
    formData,
    devfileResourceObjects.imageStream,
    dryRun,
    appResources,
    verb,
    generatedImageStreamName,
  );

  const buildConfigResponse = await createOrUpdateBuildConfig(
    formData,
    devfileResourceObjects.imageStream,
    dryRun,
    devfileResourceObjects.buildResource,
    verb,
    generatedImageStreamName,
  );

  const webhookSecretResponse = await createWebhookSecret(
    formData,
    devfileResourceObjects.imageStream,
    'generic',
    dryRun,
  );

  const deploymentResponse = await createOrUpdateDeployment(
    formData,
    devfileResourceObjects.imageStream,
    dryRun,
    devfileResourceObjects.deployResource,
    verb,
  );

  const serviceModelResponse =
    devfileResourceObjects.service &&
    (await k8sCreate(
      ServiceModel,
      createService(formData, devfileResourceObjects.imageStream, devfileResourceObjects.service),
      dryRun ? dryRunOpt : {},
    ));

  const routeResponse =
    devfileResourceObjects.route &&
    (await k8sCreate(
      RouteModel,
      createRoute(formData, devfileResourceObjects.imageStream, devfileResourceObjects.route),
      dryRun ? dryRunOpt : {},
    ));

  const devfileResources = [
    imageStreamResponse,
    buildConfigResponse,
    webhookSecretResponse,
    deploymentResponse,
  ];

  serviceModelResponse && devfileResources.push(serviceModelResponse);
  routeResponse && devfileResources.push(routeResponse);

  return devfileResources;
};

export const createOrUpdateResources = async (
  t: TFunction,
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  createNewProject?: boolean,
  dryRun: boolean = false,
  verb: K8sVerb = 'create',
  appResources?: AppResources,
): Promise<K8sResourceKind[]> => {
  const {
    name,
    project: { name: namespace },
    route: { create: canCreateRoute, disable },
    image: { ports },
    build: {
      strategy: buildStrategy,
      triggers: { webhook: webhookTrigger },
    },
    deployment: {
      triggers: { image: imageChange },
    },
    git: { url: repository, type: gitType, ref },
    pipeline,
    resources,
  } = formData;
  const imageStreamName = _.get(imageStream, 'metadata.name');
  const originalRepository =
    appResources?.buildConfig?.data?.spec?.source?.git?.uri ??
    appResources?.pipeline?.data?.spec?.params?.find((param) => param?.name === 'GIT_REPO')
      ?.default;
  createNewProject && (await createProject(formData.project));

  const responses: K8sResourceKind[] = [];
  let generatedImageStreamName: string = '';
  if (
    resources === Resources.KnativeService &&
    originalRepository &&
    originalRepository !== repository
  ) {
    generatedImageStreamName = `${name}-${getRandomChars()}`;
  }

  if (buildStrategy === BuildStrategyType.Devfile) {
    if (verb !== 'create') {
      throw new Error(t('devconsole~Cannot update Devfile resources'));
    }
    return createDevfileResources(formData, dryRun, appResources, generatedImageStreamName);
  }

  const imageStreamResponse = await createOrUpdateImageStream(
    formData,
    imageStream,
    dryRun,
    appResources,
    generatedImageStreamName ? 'create' : verb,
    generatedImageStreamName,
  );
  responses.push(imageStreamResponse);

  if (pipeline.enabled) {
    if (!dryRun) {
      const pipelineResources = await managePipelineResources(
        formData,
        appResources?.pipeline?.data,
      );
      responses.push(...pipelineResources);
    }
  } else {
    responses.push(
      await createOrUpdateBuildConfig(
        formData,
        imageStream,
        dryRun,
        appResources?.buildConfig?.data,
        generatedImageStreamName ? 'create' : verb,
        generatedImageStreamName,
      ),
    );
  }

  if (verb === 'create') {
    responses.push(await createWebhookSecret(formData, imageStream, 'generic', dryRun));
    if (webhookTrigger) {
      responses.push(await createWebhookSecret(formData, imageStream, gitType, dryRun));
    }
  }

  if (formData.resources === Resources.KnativeService) {
    const imageStreamURL = imageStreamResponse.status.dockerImageRepository;

    const originalAnnotations = appResources?.editAppResource?.data?.metadata?.annotations || {};
    const triggerAnnotations = getTriggerAnnotation(
      name,
      generatedImageStreamName || name,
      namespace,
      imageChange,
    );
    const annotations =
      Object.keys(originalAnnotations).length > 0
        ? {
            ...originalAnnotations,
            ...getGitAnnotations(repository, ref),
            ...triggerAnnotations,
          }
        : {
            ...originalAnnotations,
            ...getCommonAnnotations(),
            ...getRouteAnnotations(),
            ...getGitAnnotations(repository, ref),
            ...triggerAnnotations,
          };
    const knDeploymentResource = getKnativeServiceDepResource(
      formData,
      imageStreamURL,
      imageStreamName,
      undefined,
      undefined,
      annotations,
      _.get(appResources, 'editAppResource.data'),
      generatedImageStreamName,
    );
    const domainMappingResources = await getDomainMappingRequests(
      formData,
      knDeploymentResource,
      dryRun,
    );
    const knativeResources = await Promise.all([
      verb === 'update'
        ? k8sUpdate(KnServiceModel, knDeploymentResource, null, null, dryRun ? dryRunOpt : {})
        : k8sCreate(KnServiceModel, knDeploymentResource, dryRun ? dryRunOpt : {}),
      ...domainMappingResources,
    ]);
    return [...knativeResources, ...responses];
  }

  if (formData.resources === Resources.Kubernetes) {
    responses.push(
      await createOrUpdateDeployment(
        formData,
        imageStream,
        dryRun,
        _.get(appResources, 'editAppResource.data'),
        verb,
      ),
    );
  } else if (formData.resources === Resources.OpenShift) {
    responses.push(
      await createOrUpdateDeploymentConfig(
        formData,
        imageStream,
        dryRun,
        _.get(appResources, 'editAppResource.data'),
        verb,
      ),
    );
  }

  if (
    !_.isEmpty(ports) ||
    buildStrategy === BuildStrategyType.Docker ||
    buildStrategy === BuildStrategyType.Source
  ) {
    const originalService = _.get(appResources, 'service.data');
    const service = createService(formData, imageStream, originalService);

    if (verb === 'create') {
      responses.push(await k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {}));
    } else if (verb === 'update' && !_.isEmpty(originalService)) {
      responses.push(await k8sUpdate(ServiceModel, service));
    }

    const originalRoute = _.get(appResources, 'route.data');
    const route = createRoute(formData, imageStream, originalRoute);
    if (verb === 'update' && disable) {
      responses.push(await k8sUpdate(RouteModel, route, namespace, name));
    } else if (canCreateRoute) {
      responses.push(await k8sCreate(RouteModel, route, dryRun ? dryRunOpt : {}));
    }
  }

  return responses;
};

export const handleRedirect = async (
  project: string,
  perspective: string,
  perspectiveExtensions: Perspective[],
) => {
  const perspectiveData = perspectiveExtensions.find((item) => item.properties.id === perspective);
  const redirectURL = (await perspectiveData.properties.importRedirectURL())(project);
  history.push(redirectURL);
};

export const isRouteAdvOptionsUsed = (
  type: string,
  routeData: RouteData,
  ksvcRouteData: ServerlessData,
): boolean => {
  if (type !== Resources.KnativeService && routeData) {
    if (!!routeData.hostname || !!routeData.path || !routeData.secure) return true;
    if (routeData?.tls) {
      for (const tlsKey in routeData.tls) {
        if (routeData.tls.hasOwnProperty(tlsKey)) {
          if (
            ['caCertificate', 'certificate', 'destinationCACertificate', 'key'].includes(tlsKey) &&
            !!routeData.tls[tlsKey]
          )
            return true;
          if (tlsKey === 'insecureEdgeTerminationPolicy' && routeData.tls[tlsKey] !== 'None')
            return true;
          if (tlsKey === 'termination' && routeData.tls[tlsKey] !== 'reencrypt') return true;
        }
      }
    }
    return false;
  }
  if (ksvcRouteData.domainMapping?.length > 0) return true;
  return false;
};

export const isScalingAdvOptions = (
  type: string,
  scalingData: DeploymentData,
  ksvcData: ServerlessData,
): boolean => {
  if (type !== Resources.KnativeService && scalingData?.replicas > 1) {
    return true;
  }
  const ksvcScalingData = ksvcData?.scaling;
  if (ksvcScalingData) {
    for (const scKey in ksvcScalingData) {
      if (ksvcScalingData.hasOwnProperty(scKey)) {
        if (['concurrencylimit', 'maxpods', 'minpods'].includes(scKey) && !!ksvcScalingData[scKey])
          return true;
        if (
          scKey === 'concurrencytarget' &&
          ksvcScalingData[scKey] !== ksvcScalingData.defaultConcurrencytarget
        )
          return true;
        if (
          scKey === 'concurrencyutilization' &&
          ksvcScalingData[scKey] !== ksvcScalingData.defaultConcurrencyutilization
        )
          return true;
        if (scKey === 'autoscale' && ksvcScalingData[scKey]) {
          const autoscaleData = ksvcScalingData[scKey];
          for (const asKey in autoscaleData) {
            if (autoscaleData.hasOwnProperty(asKey)) {
              if (
                asKey === 'autoscalewindow' &&
                autoscaleData[asKey] !== autoscaleData.defaultAutoscalewindow
              )
                return true;
              if (
                asKey === 'autoscalewindowUnit' &&
                autoscaleData[asKey] !== autoscaleData.defaultAutoscalewindowUnit
              )
                return true;
            }
          }
        }
      }
    }
  }
  return false;
};

export const isResourceLimitAdvOptions = (resLimits: LimitsData): boolean => {
  const isLimitUsed = (resLimitObj) => {
    for (const limitKey in resLimitObj) {
      if (resLimitObj.hasOwnProperty(limitKey)) {
        if (['limit', 'request'].includes(limitKey) && !!resLimitObj[limitKey]) return true;
        if (limitKey === 'limitUnit' && resLimitObj[limitKey] !== resLimitObj.defaultLimitUnit)
          return true;
        if (limitKey === 'requestUnit' && resLimitObj[limitKey] !== resLimitObj.defaultRequestUnit)
          return true;
      }
    }
    return false;
  };

  if (isLimitUsed(resLimits.cpu) || isLimitUsed(resLimits.memory)) return true;
  return false;
};

export const getTelemetryImport = (values: GitImportFormData) => {
  if (!values) return {};
  // get devfile data if exists
  let devfileJson;
  if (values.devfile?.devfileContent) {
    devfileJson = safeYAMLToJS(values.devfile.devfileContent);
  }
  const applicationType =
    (!values.application?.selectedKey && values.application?.name) ||
    values.application?.selectedKey === values.application?.name
      ? 'default'
      : values.application?.selectedKey === CREATE_APPLICATION_KEY && !!values.application?.name
      ? 'custom'
      : 'none';
  const resourceType =
    values.resources === Resources.Kubernetes
      ? 'Deployment'
      : values.resources === Resources.OpenShift
      ? 'DeploymentConfig'
      : values.resources === Resources.KnativeService && 'Knative Service';
  const selStrategy = values.import?.selectedStrategy?.name;
  const telemetryImportData = {
    useRecommended: values.image?.recommended === values.image?.selected,
    recommendedStrategy: values.import?.recommendedStrategy?.name,
    recommendedBuilderImage: values.image?.recommended,
    strategy: selStrategy,
    builderImage: values.image?.selected,

    devFileLanguage: devfileJson?.metadata?.projectType || '',
    devFileProjectType: devfileJson?.metadata?.language || '',

    application: applicationType,

    resource: resourceType,

    targetPortChanged: !!values.route?.unknownTargetPort,

    // currently run command is being used only for Node app
    useRunCommand: !!values.image?.imageEnv?.NPM_RUN,

    useAdvancedOptionsGit: values.git.dir !== '/' || !!values.git.ref || !!values.git.secret,

    useAdvancedOptionsBuild:
      values.build?.env.length > 0 || _.some(values.build?.triggers, (key) => !key),
    useAdvancedOptionsDeployment:
      selStrategy !== 'Devfile' &&
      (values.deployment?.env.length > 0 || !values.deployment?.triggers?.image),
    useAdvancedOptionsRoute: isRouteAdvOptionsUsed(
      values.resources,
      values.route,
      values.serverless,
    ),
    useAdvancedOptionsHealthChecks:
      values.healthChecks?.livenessProbe?.enabled ||
      values.healthChecks?.readinessProbe?.enabled ||
      values.healthChecks?.startupProbe?.enabled,
    useAdvancedOptionsScaling: isScalingAdvOptions(
      values.resources,
      values.deployment,
      values.serverless,
    ),
    useAdvancedOptionsResourceLimits: isResourceLimitAdvOptions(values.limits),
    useAdvancedOptionsLabels: !_.isEmpty(values.labels),
  };

  return telemetryImportData;
};
