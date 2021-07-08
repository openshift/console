import * as _ from 'lodash';
import { coFetch } from '@console/internal/co-fetch';
import {
  ServiceModel,
  RouteModel,
  BuildConfigModel,
  DeploymentModel,
  DeploymentConfigModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind, k8sUpdate, K8sVerb } from '@console/internal/module/k8s';
import { ServiceModel as KnServiceModel } from '@console/knative-plugin';
import {
  getDomainMappingRequests,
  getKnativeServiceDepResource,
} from '@console/knative-plugin/src/utils/create-knative-utils';
import { getRandomChars, NameValuePair, getResourceLimitsData } from '@console/shared';
import {
  getAppLabels,
  getCommonAnnotations,
  getPodLabels,
  getTemplateLabels,
  getTriggerAnnotation,
  mergeData,
} from '../../utils/resource-label-utils';
import { createRoute, createService, dryRunOpt } from '../../utils/shared-submit-utils';
import { AppResources } from '../edit-application/edit-application-types';
import { getProbesData } from '../health-checks/create-health-checks-probe-utils';
import {
  createOrUpdateImageStream,
  createProject,
  createWebhookSecret,
} from './import-submit-utils';
import { Resources, UploadJarFormData } from './import-types';

export const createOrUpdateDeployment = (
  formData: UploadJarFormData,
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
    fileUpload: { name: fileName, javaArgs },
    labels: userLabels,
    limits: { cpu, memory },
    healthChecks,
    runtimeIcon,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels({
    name,
    applicationName,
    imageStreamName,
    runtimeIcon,
    selectedTag,
  });
  const imageName = name;
  const annotations = {
    ...getCommonAnnotations(),
    'alpha.image.policy.openshift.io/resolve-names': '*',
    ...getTriggerAnnotation(name, imageName, namespace, imageChange),
  };
  const podLabels = getPodLabels(name);
  const templateLabels = getTemplateLabels(originalDeployment);

  const jArgsIndex = env?.findIndex((e) => e.name === 'JAVA_ARGS');
  if (jArgsIndex !== -1) {
    if (javaArgs !== '') {
      (env[jArgsIndex] as NameValuePair).value = javaArgs;
    } else {
      env.splice(jArgsIndex, 1);
    }
  } else if (javaArgs !== '') {
    env.push({ name: 'JAVA_ARGS', value: javaArgs });
  }

  const newDeployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: { ...annotations, jarFileName: fileName },
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

const createOrUpdateDeploymentConfig = (
  formData: UploadJarFormData,
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
    fileUpload: { javaArgs },
    labels: userLabels,
    limits: { cpu, memory },
    healthChecks,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const podLabels = getPodLabels(name);
  const templateLabels = getTemplateLabels(originalDeploymentConfig);

  const jArgsIndex = env?.findIndex((e) => e.name === 'JAVA_ARGS');
  if (jArgsIndex !== -1) {
    if (javaArgs !== '') {
      (env[jArgsIndex] as NameValuePair).value = javaArgs;
    } else {
      env.splice(jArgsIndex, 1);
    }
  } else if (javaArgs !== '') {
    env.push({ name: 'JAVA_ARGS', value: javaArgs });
  }

  const newDeploymentConfig = {
    apiVersion: 'apps.openshift.io/v1',
    kind: 'DeploymentConfig',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: { ...getCommonAnnotations() },
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

export const createOrUpdateBuildConfig = (
  formData: UploadJarFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
  originalBuildConfig?: K8sResourceKind,
  verb: K8sVerb = 'create',
  generatedImageStreamName: string = '',
): Promise<K8sResourceKind> => {
  const {
    name,
    fileUpload: { name: jarFileName },
    project: { name: namespace },
    application: { name: applicationName },
    image: { tag: selectedTag },
    build: { env, strategy: buildStrategy },
    labels: userLabels,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const imageStreamNamespace = imageStream && imageStream.metadata.namespace;

  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const defaultAnnotations = { ...getCommonAnnotations(), jarFileName };
  const buildStrategyData = {
    sourceStrategy: {
      env,
      from: {
        kind: 'ImageStreamTag',
        name: `${imageStreamName}:${selectedTag}`,
        namespace: imageStreamNamespace,
      },
    },
  };

  const buildConfigName = verb === 'update' ? originalBuildConfig?.metadata?.name : name;
  const newBuildConfig = {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      name: buildConfigName,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
    },
    spec: {
      output: {
        to: {
          kind: 'ImageStreamTag',
          name: `${generatedImageStreamName || name}:latest`,
        },
      },
      source: {
        type: 'Binary',
        binary: {},
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
      ],
    },
  };

  const buildConfig = mergeData(originalBuildConfig, newBuildConfig);

  return verb === 'update'
    ? k8sUpdate(BuildConfigModel, buildConfig)
    : k8sCreate(BuildConfigModel, buildConfig, dryRun ? dryRunOpt : {});
};

export const instantiateBinaryBuild = (
  namespace: string,
  buildConfigResponse: K8sResourceKind,
  filename: string,
  value: File,
) => {
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    // Chrome requires returnValue to be set
    // from https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
    e.returnValue = '';
  };
  window.addEventListener('beforeunload', onBeforeUnload);
  coFetch(
    `/api/kubernetes/apis/build.openshift.io/v1/namespaces/${namespace}/buildconfigs/${buildConfigResponse.metadata.name}/instantiatebinary?asFile=${filename}`,
    {
      method: 'POST',
      body: value,
      headers: {
        'Content-type': value.type,
      },
    },
    0,
  )
    .then(() => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.log(err);
      window.removeEventListener('beforeunload', onBeforeUnload);
    });
};

export const createOrUpdateJarFile = async (
  formData: UploadJarFormData,
  imageStream: K8sResourceKind,
  createNewProject?: boolean,
  dryRun: boolean = false,
  verb: K8sVerb = 'create',
  appResources?: AppResources,
): Promise<K8sResourceKind[]> => {
  const {
    name,
    fileUpload: { name: fileName, value: fileValue },
    project: { name: namespace },
    route: { create: canCreateRoute, disable },
    image: { ports },
    build: { strategy: buildStrategy },
    deployment: {
      triggers: { image: imageChange },
    },
    resources,
  } = formData;
  const {
    imageStream: appResImageStream,
    buildConfig: appResBuildConfig,
    editAppResource,
    service: appResService,
    route: appResRoute,
  } = appResources || {};

  const imageStreamName = imageStream?.metadata.name;

  createNewProject && (await createProject(formData.project));

  const responses = [];
  let generatedImageStreamName: string = '';
  const imageStreamList = appResImageStream?.data;
  if (
    resources === Resources.KnativeService &&
    imageStreamList &&
    imageStreamList.length &&
    verb === 'update' &&
    fileValue !== ''
  ) {
    generatedImageStreamName = `${name}-${getRandomChars()}`;
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

  const buildConfigResponse = await createOrUpdateBuildConfig(
    formData,
    imageStream,
    dryRun,
    appResBuildConfig?.data,
    verb,
    generatedImageStreamName,
  );

  buildConfigResponse &&
    !dryRun &&
    fileValue !== '' &&
    instantiateBinaryBuild(namespace, buildConfigResponse, fileName, fileValue as File);

  responses.push(buildConfigResponse);

  if (verb === 'create') {
    responses.push(await createWebhookSecret(formData, 'generic', dryRun));
  }

  if (resources === Resources.KnativeService) {
    const imageStreamURL = imageStreamResponse.status.dockerImageRepository;

    const originalAnnotations = editAppResource?.data?.metadata?.annotations || {};
    const triggerAnnotations = getTriggerAnnotation(
      name,
      generatedImageStreamName || name,
      namespace,
      imageChange,
    );
    const annotations = {
      ...originalAnnotations,
      ...triggerAnnotations,
    };
    const knDeploymentResource = getKnativeServiceDepResource(
      formData,
      imageStreamURL,
      imageStreamName,
      undefined,
      undefined,
      annotations,
      editAppResource?.data,
    );
    const domainMappingResources = await getDomainMappingRequests(
      formData,
      knDeploymentResource,
      dryRun,
    );
    responses.push(
      ...[
        verb === 'update'
          ? k8sUpdate(KnServiceModel, knDeploymentResource, null, null, dryRun ? dryRunOpt : {})
          : k8sCreate(KnServiceModel, knDeploymentResource, dryRun ? dryRunOpt : {}),
        ...domainMappingResources,
      ],
    );
    return Promise.all(responses);
  }
  if (resources === Resources.Kubernetes) {
    responses.push(
      await createOrUpdateDeployment(formData, imageStream, dryRun, editAppResource?.data, verb),
    );
  } else if (resources === Resources.OpenShift) {
    responses.push(
      await createOrUpdateDeploymentConfig(
        formData,
        imageStream,
        dryRun,
        editAppResource?.data,
        verb,
      ),
    );
  }

  if (!_.isEmpty(ports) || buildStrategy === 'Source') {
    const originalService = appResService?.data;
    const service = createService(formData, imageStream, originalService);

    if (verb === 'create') {
      responses.push(await k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {}));
    } else if (verb === 'update' && !_.isEmpty(originalService)) {
      responses.push(await k8sUpdate(ServiceModel, service));
    }

    const originalRoute = appResRoute?.data;
    const route = createRoute(formData, imageStream, originalRoute);
    if (verb === 'update' && disable) {
      responses.push(await k8sUpdate(RouteModel, route, namespace, name));
    } else if (canCreateRoute) {
      responses.push(await k8sCreate(RouteModel, route, dryRun ? dryRunOpt : {}));
    }
  }

  return responses;
};
