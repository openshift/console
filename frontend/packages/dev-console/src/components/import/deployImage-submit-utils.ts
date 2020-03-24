import * as _ from 'lodash';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ImageStreamModel,
  ServiceModel,
  RouteModel,
  RoleBindingModel,
} from '@console/internal/models';
import { k8sCreate, K8sResourceKind, K8sVerb, k8sUpdate } from '@console/internal/module/k8s';
import {
  getKnativeServiceDepResource,
  ServiceModel as KnServiceModel,
} from '@console/knative-plugin';
import { getRandomChars } from '@console/shared/src/utils';
import { getAppLabels, getPodLabels, mergeData } from '../../utils/resource-label-utils';
import {
  createRoute,
  createService,
  annotations,
  dryRunOpt,
} from '../../utils/shared-submit-utils';
import { RegistryType } from '../../utils/imagestream-utils';
import { AppResources } from '../edit-application/edit-application-types';
import { DeployImageFormData, Resources } from './import-types';

export const createSystemImagePullerRoleBinding = (
  formData: DeployImageFormData,
  dryRun: boolean,
): Promise<K8sResourceKind> => {
  const { imageStream } = formData;
  const roleBinding = {
    kind: RoleBindingModel.kind,
    apiVersion: `${RoleBindingModel.apiGroup}/${RoleBindingModel.apiVersion}`,
    metadata: {
      name: 'system:image-puller',
      namespace: imageStream.namespace,
    },
    subjects: [
      {
        kind: 'ServiceAccount',
        name: 'default',
        namespace: formData.project.name,
      },
    ],
    roleRef: {
      apiGroup: RoleBindingModel.apiGroup,
      kind: 'ClusterRole',
      name: 'system:image-puller',
    },
  };
  return k8sCreate(RoleBindingModel, roleBinding, dryRun ? dryRunOpt : {});
};

export const createOrUpdateImageStream = (
  formData: DeployImageFormData,
  dryRun: boolean,
  originalImageStream?: K8sResourceKind,
  verb: K8sVerb = 'create',
  generatedImageStreamName: string = '',
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    application: { name: application },
    name,
    isi: { name: isiName, tag },
    labels: userLabels,
  } = formData;
  const defaultLabels = getAppLabels(name, application);
  const newImageStream = {
    apiVersion: 'image.openshift.io/v1',
    kind: 'ImageStream',
    metadata: {
      name: `${generatedImageStreamName || name}`,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
    },
    spec: {
      tags: [
        {
          name: tag,
          annotations: {
            ...annotations,
            'openshift.io/imported-from': isiName,
          },
          from: {
            kind: 'DockerImage',
            name: `${isiName}`,
          },
          importPolicy: {},
        },
      ],
    },
  };
  const imageStream = mergeData(originalImageStream, newImageStream);

  return verb === 'update'
    ? k8sUpdate(ImageStreamModel, imageStream)
    : k8sCreate(ImageStreamModel, newImageStream, dryRun ? dryRunOpt : {});
};

const getMetadata = (formData: DeployImageFormData) => {
  const {
    application: { name: application },
    name,
    isi: { image },
    labels: userLabels,
    imageStream: { image: imgName, tag: imgTag, namespace: imgNamespace },
  } = formData;

  const defaultLabels = getAppLabels(name, application, imgName || undefined, imgTag, imgNamespace);
  const labels = { ...defaultLabels, ...userLabels };
  const podLabels = getPodLabels(name);

  const volumes = [];
  const volumeMounts = [];
  let volumeNumber = 0;
  _.each(_.get(image, ['dockerImageMetadata', 'Config', 'Volumes']), (value, path) => {
    volumeNumber++;
    const volumeName = `${name}-${volumeNumber}`;
    volumes.push({
      name: volumeName,
      emptyDir: {},
    });
    volumeMounts.push({
      name: volumeName,
      mountPath: path,
    });
  });

  return { labels, podLabels, volumes, volumeMounts };
};

export const createOrUpdateDeployment = (
  formData: DeployImageFormData,
  dryRun: boolean,
  originalDeployment?: K8sResourceKind,
  verb: K8sVerb = 'create',
): Promise<K8sResourceKind> => {
  const {
    registry,
    project: { name: namespace },
    name,
    isi: { image, ports, tag: imageStreamTag },
    deployment: { env, replicas },
    labels: userLabels,
    limits: { cpu, memory },
    imageStream: { image: imgName, namespace: imgNamespace },
  } = formData;

  const defaultAnnotations = {
    ...annotations,
    'alpha.image.policy.openshift.io/resolve-names': '*',
    'image.openshift.io/triggers': JSON.stringify([
      {
        from: {
          kind: 'ImageStreamTag',
          name: `${imgName || name}:${imageStreamTag}`,
          namespace: imgNamespace || namespace,
        },
        fieldPath: `spec.template.spec.containers[?(@.name=="${name}")].image`,
      },
    ]),
  };

  const { labels, podLabels, volumes, volumeMounts } = getMetadata(formData);

  const imageRef =
    registry === RegistryType.External
      ? `${name}:${imageStreamTag}`
      : _.get(image, 'dockerImageReference');

  const newDeployment = {
    kind: 'Deployment',
    apiVersion: 'apps/v1',
    metadata: {
      name,
      namespace,
      labels,
      annotations: defaultAnnotations,
    },
    spec: {
      replicas,
      selector: {
        matchLabels: {
          app: name,
        },
      },
      template: {
        metadata: {
          labels: { ...userLabels, ...podLabels },
          annotations,
        },
        spec: {
          volumes,
          containers: [
            {
              name,
              image: imageRef,
              ports,
              volumeMounts,
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

  const deployment = mergeData(originalDeployment, newDeployment);

  return verb === 'update'
    ? k8sUpdate(DeploymentModel, deployment)
    : k8sCreate(DeploymentModel, deployment, dryRun ? dryRunOpt : {});
};

export const createOrUpdateDeploymentConfig = (
  formData: DeployImageFormData,
  dryRun: boolean,
  originalDeploymentConfig?: K8sResourceKind,
  verb: K8sVerb = 'create',
): Promise<K8sResourceKind> => {
  const {
    project: { name: namespace },
    name,
    isi: { image, tag, ports },
    deployment: { env, replicas, triggers },
    labels: userLabels,
    limits: { cpu, memory },
    imageStream: { image: imgName, namespace: imgNamespace },
  } = formData;

  const { labels, podLabels, volumes, volumeMounts } = getMetadata(formData);
  const newDeploymentConfig = {
    kind: 'DeploymentConfig',
    apiVersion: 'apps.openshift.io/v1',
    metadata: {
      name,
      namespace,
      labels,
      annotations,
    },
    spec: {
      replicas,
      selector: podLabels,
      template: {
        metadata: {
          labels: { ...userLabels, ...podLabels },
          annotations,
        },
        spec: {
          volumes,
          containers: [
            {
              name,
              image: _.get(image, ['dockerImageMetadata', 'Config', 'Image']),
              ports,
              volumeMounts,
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
              name: `${imgName || name}:${tag}`,
              namespace: imgNamespace || namespace,
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

export const ensurePortExists = (formData: DeployImageFormData): DeployImageFormData => {
  const {
    isi: { ports },
    route: { defaultUnknownPort, unknownTargetPort },
  } = formData;

  let values = formData;
  if (!Array.isArray(ports) || ports.length === 0) {
    // If we lack pre-defined ports but they have specified a custom target port, use that instead
    const containerPort = unknownTargetPort ? parseInt(unknownTargetPort, 10) : defaultUnknownPort;
    const suppliedPorts = [{ containerPort, protocol: 'TCP' }];

    values = {
      ...values,
      isi: {
        ...values.isi,
        ports: suppliedPorts,
      },
    };
  }

  return values;
};

export const createOrUpdateDeployImageResources = async (
  rawFormData: DeployImageFormData,
  dryRun: boolean = false,
  verb: K8sVerb = 'create',
  appResources?: AppResources,
): Promise<K8sResourceKind[]> => {
  const formData = ensurePortExists(rawFormData);
  const {
    name,
    registry,
    route: { create: canCreateRoute, disable },
    isi: { ports, tag: imageStreamTag, image },
    imageStream: { image: internalImageName, namespace: internalImageNamespace },
  } = formData;

  const requests: Promise<K8sResourceKind>[] = [];
  if (registry === RegistryType.Internal) {
    formData.imageStream.grantAccess &&
      requests.push(createSystemImagePullerRoleBinding(formData, dryRun));
  }
  const imageStreamList = appResources?.imageStream?.data;
  const imageStreamData = _.orderBy(imageStreamList, ['metadata.resourceVersion'], ['desc']);
  const originalImageStream = (imageStreamData.length && imageStreamData[0]) || {};
  if (formData.resources !== Resources.KnativeService) {
    registry === RegistryType.External &&
      (await createOrUpdateImageStream(formData, dryRun, originalImageStream, verb));
    if (formData.resources === Resources.Kubernetes) {
      requests.push(
        createOrUpdateDeployment(
          formData,
          dryRun,
          _.get(appResources, 'editAppResource.data'),
          verb,
        ),
      );
    } else {
      requests.push(
        createOrUpdateDeploymentConfig(
          formData,
          dryRun,
          _.get(appResources, 'editAppResource.data'),
          verb,
        ),
      );
    }
    if (!_.isEmpty(ports)) {
      const service = createService(formData, undefined, _.get(appResources, 'service.data'));
      requests.push(
        verb === 'update'
          ? k8sUpdate(ServiceModel, service)
          : k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {}),
      );
      const route = createRoute(formData, undefined, _.get(appResources, 'route.data'));
      if (verb === 'update' && disable) {
        requests.push(k8sUpdate(RouteModel, route));
      } else if (canCreateRoute) {
        requests.push(k8sCreate(RouteModel, route, dryRun ? dryRunOpt : {}));
      }
    }
  } else if (!dryRun) {
    // Do not run serverless call during the dry run.
    let imageStreamUrl: string = image?.dockerImageReference;
    if (registry === RegistryType.External) {
      let generatedImageStreamName: string = '';
      if (verb === 'update') {
        if (imageStreamList && imageStreamList.length) {
          const originalImageStreamTag = _.find(originalImageStream?.status?.tags, [
            'tag',
            imageStreamTag,
          ]);
          if (!_.isEmpty(originalImageStreamTag)) {
            generatedImageStreamName = `${name}-${getRandomChars()}`;
          }
        } else {
          generatedImageStreamName = `${name}-${getRandomChars()}`;
        }
      }
      const imageStreamResponse = await createOrUpdateImageStream(
        formData,
        dryRun,
        originalImageStream,
        generatedImageStreamName ? 'create' : verb,
        generatedImageStreamName,
      );
      const imageStreamRepo = imageStreamResponse.status.dockerImageRepository;
      imageStreamUrl = imageStreamTag ? `${imageStreamRepo}:${imageStreamTag}` : imageStreamRepo;
    }
    const knDeploymentResource = getKnativeServiceDepResource(
      formData,
      imageStreamUrl,
      internalImageName || name,
      imageStreamTag,
      internalImageNamespace,
      annotations,
      _.get(appResources, 'editAppResource.data'),
    );
    requests.push(
      verb === 'update'
        ? k8sUpdate(KnServiceModel, knDeploymentResource)
        : k8sCreate(KnServiceModel, knDeploymentResource),
    );
  }

  return Promise.all(requests);
};
