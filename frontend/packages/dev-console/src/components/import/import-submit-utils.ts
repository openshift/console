import * as _ from 'lodash';
import {
  ImageStreamModel,
  BuildConfigModel,
  DeploymentModel,
  DeploymentConfigModel,
  ProjectRequestModel,
  SecretModel,
  ServiceModel,
  RouteModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind, k8sUpdate, K8sVerb } from '@console/internal/module/k8s';
import {
  getKnativeServiceDepResource,
  ServiceModel as KnServiceModel,
} from '@console/knative-plugin';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { getAppLabels, getPodLabels, getAppAnnotations } from '../../utils/resource-label-utils';
import { createService, createRoute, dryRunOpt } from '../../utils/shared-submit-utils';
import { AppResources } from '../edit-application/edit-application-types';
import {
  GitImportFormData,
  ProjectData,
  GitTypes,
  GitReadableTypes,
  Resources,
} from './import-types';
import { createPipelineForImportFlow } from './pipeline/pipeline-template-utils';

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
    image: { tag },
  } = formData;
  const imageStreamName = imageStreamData && imageStreamData.metadata.name;
  const defaultLabels = getAppLabels(name, application, imageStreamName, tag);
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

export const createWebhookSecret = (
  formData: GitImportFormData,
  secretType: string,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
  } = formData;

  const webhookSecret = {
    apiVersion: 'v1',
    data: {},
    kind: 'Secret',
    metadata: {
      name: `${name}-${secretType}-webhook-secret`,
      namespace,
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
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: application },
    git: { url: repository, type: gitType, ref = 'master', dir: contextDir, secret: secretName },
    docker: { dockerfilePath },
    image: { tag: selectedTag },
    build: { env, triggers, strategy: buildStrategy },
    labels: userLabels,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const imageStreamNamespace = imageStream && imageStream.metadata.namespace;

  const defaultLabels = getAppLabels(name, application, imageStreamName, selectedTag);
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

  const webhookTriggerData = {
    type: GitReadableTypes[gitType],
    [gitType]: {
      secretReference: { name: `${name}-${gitType}-webhook-secret` },
    },
  };

  const buildConfig = {
    ...(originalBuildConfig || {}),
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      ...(originalBuildConfig ? originalBuildConfig.metadata : {}),
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
    },
    spec: {
      ...(originalBuildConfig ? originalBuildConfig.spec : {}),
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
        {
          type: 'Generic',
          generic: {
            secretReference: { name: `${name}-generic-webhook-secret` },
          },
        },
        ...(triggers.webhook && gitType !== GitTypes.unsure ? [webhookTriggerData] : []),
        ...(triggers.image ? [{ type: 'ImageChange', imageChange: {} }] : []),
        ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
      ],
    },
  };

  return verb === 'update'
    ? k8sUpdate(BuildConfigModel, buildConfig)
    : k8sCreate(BuildConfigModel, buildConfig, dryRun ? dryRunOpt : {});
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
    application: { name: application },
    image: { ports, tag },
    deployment: { env, replicas },
    labels: userLabels,
    limits: { cpu, memory },
    git: { url: repository, ref },
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels(name, application, imageStreamName, tag);
  const annotations = {
    ...getAppAnnotations(repository, ref),
    'alpha.image.policy.openshift.io/resolve-names': '*',
    'image.openshift.io/triggers': JSON.stringify([
      {
        from: { kind: 'ImageStreamTag', name: `${name}:latest` },
        fieldPath: `spec.template.spec.containers[?(@.name=="${name}")].image`,
      },
    ]),
  };
  const podLabels = getPodLabels(name);

  const deployment = {
    ...(originalDeployment || {}),
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      ...(originalDeployment ? originalDeployment.metadata : {}),
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations,
    },
    spec: {
      ...(originalDeployment ? originalDeployment.spec : {}),
      selector: {
        matchLabels: {
          app: name,
        },
      },
      replicas,
      template: {
        metadata: {
          labels: { ...userLabels, ...podLabels },
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
    },
  };

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
    application: { name: application },
    image: { ports, tag },
    deployment: { env, replicas, triggers },
    labels: userLabels,
    limits: { cpu, memory },
    git: { url: repository, ref },
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels(name, application, imageStreamName, tag);
  const defaultAnnotations = getAppAnnotations(repository, ref);
  const podLabels = getPodLabels(name);

  const deploymentConfig = {
    ...(originalDeploymentConfig || {}),
    apiVersion: 'apps.openshift.io/v1',
    kind: 'DeploymentConfig',
    metadata: {
      ...(originalDeploymentConfig ? originalDeploymentConfig.metadata : {}),
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
    },
    spec: {
      ...(originalDeploymentConfig ? originalDeploymentConfig.spec : {}),
      selector: podLabels,
      replicas,
      template: {
        metadata: {
          labels: { ...userLabels, ...podLabels },
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

  return verb === 'update'
    ? k8sUpdate(DeploymentConfigModel, deploymentConfig)
    : k8sCreate(DeploymentConfigModel, deploymentConfig, dryRun ? dryRunOpt : {});
};

export const createOrUpdateResources = async (
  formData: GitImportFormData,
  imageStream: K8sResourceKind,
  createNewProject?: boolean,
  dryRun: boolean = false,
  verb: K8sVerb = 'create',
  appResources?: AppResources,
  editAppResource?: K8sResourceKind,
): Promise<K8sResourceKind[]> => {
  const {
    name,
    project: { name: namespace },
    route: { create: canCreateRoute, show: showRouteCheckbox },
    image: { ports },
    build: {
      strategy: buildStrategy,
      triggers: { webhook: webhookTrigger },
    },
    git: { url: repository, type: gitType, ref },
    pipeline,
  } = formData;
  const imageStreamName = _.get(imageStream, 'metadata.name');

  createNewProject && (await createProject(formData.project));

  const requests: Promise<K8sResourceKind>[] = [];

  verb === 'create' &&
    requests.push(
      createImageStream(formData, imageStream, dryRun),
      createWebhookSecret(formData, 'generic', dryRun),
    );

  requests.push(
    createOrUpdateBuildConfig(
      formData,
      imageStream,
      dryRun,
      _.get(appResources, 'buildConfig.data', null),
      verb,
    ),
  );

  const defaultAnnotations = getAppAnnotations(repository, ref);

  if (formData.resources === Resources.KnativeService) {
    // knative service doesn't have dry run capability so returning the promises.
    if (dryRun) {
      return Promise.all(requests);
    }
    let imageStreamURL: string;
    const knativeRequests = [];
    if (verb === 'update') {
      imageStreamURL = _.get(editAppResource, 'spec.template.spec.containers[0].image', '');
      knativeRequests.push(...requests);
    } else {
      const [imageStreamResponse] = await Promise.all(requests);
      imageStreamURL = imageStreamResponse.status.dockerImageRepository;
    }
    const knDeploymentResource = getKnativeServiceDepResource(
      formData,
      imageStreamURL,
      imageStreamName,
      defaultAnnotations,
      editAppResource,
    );
    knativeRequests.push(
      verb === 'update'
        ? k8sUpdate(KnServiceModel, knDeploymentResource)
        : k8sCreate(KnServiceModel, knDeploymentResource),
    );
    return Promise.all(knativeRequests);
  }

  if (formData.resources === Resources.Kubernetes) {
    requests.push(createOrUpdateDeployment(formData, imageStream, dryRun, editAppResource, verb));
  } else if (formData.resources === Resources.OpenShift) {
    requests.push(
      createOrUpdateDeploymentConfig(formData, imageStream, dryRun, editAppResource, verb),
    );
  }

  if (!_.isEmpty(ports) || buildStrategy === 'Docker') {
    const originalService = _.get(appResources, 'service.data', null);
    const service = createService(formData, imageStream, originalService);
    requests.push(
      verb === 'update'
        ? k8sUpdate(ServiceModel, service)
        : k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {}),
    );
    const originalRoute = _.get(appResources, 'route.data', null);
    const route = createRoute(formData, imageStream, originalRoute);
    if (verb === 'update' && !showRouteCheckbox) {
      requests.push(k8sUpdate(RouteModel, route, namespace, name));
    } else if (canCreateRoute) {
      requests.push(k8sCreate(RouteModel, route, dryRun ? dryRunOpt : {}));
    }
  }

  if (pipeline.enabled && pipeline.template && !dryRun) {
    requests.push(createPipelineForImportFlow(formData));
  }

  if (webhookTrigger && verb === 'create') {
    requests.push(createWebhookSecret(formData, gitType, dryRun));
  }

  return Promise.all(requests);
};
