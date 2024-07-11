import * as _ from 'lodash';
import { getAPIVersionForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { ContainerSpec, EnvVar, K8sResourceKind } from '@console/internal/module/k8s';
import { TRIGGERS_ANNOTATION } from '@console/shared';
import { getTriggerAnnotation } from '../../../utils/resource-label-utils';
import {
  checkIfTriggerExists,
  getResourcesType,
} from '../../edit-application/edit-application-utils';
import { ImageStreamImageData, Resources } from '../../import/import-types';
import {
  DeploymentStrategyType,
  FailurePolicyType,
  LifecycleAction,
} from '../deployment-strategy/utils/types';
import {
  DeploymentStrategy,
  DeploymentStrategyData,
  EditDeploymentFormData,
  LifecycleHookData,
  LifecycleHookFormData,
  LifecycleHookImagestreamData,
  TriggersAndImageStreamFormData,
} from './deployment-types';

export const getDefaultDeploymentConfig = (namespace: string): K8sResourceKind => {
  const defaultDeploymentConfig: K8sResourceKind = {
    apiVersion: getAPIVersionForModel(DeploymentConfigModel),
    kind: DeploymentConfigModel.kind,
    metadata: {
      namespace,
      name: '',
    },
    spec: {
      selector: {},
      replicas: 3,
      template: {
        metadata: {
          labels: {},
        },
        spec: {
          containers: [
            {
              name: 'container',
              image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
            },
          ],
        },
      },
      strategy: {
        type: DeploymentStrategyType.rollingParams,
        rollingParams: {
          updatePeriodSeconds: 1,
          intervalSeconds: 1,
          timeoutSeconds: 600,
          maxUnavailable: '25%',
          maxSurge: '25%',
        },
      },
      triggers: [
        {
          type: 'ConfigChange',
        },
      ],
    },
  };

  return defaultDeploymentConfig;
};

export const getDefaultDeployment = (namespace: string): K8sResourceKind => {
  const defaultDeployment: K8sResourceKind = {
    apiVersion: getAPIVersionForModel(DeploymentModel),
    kind: DeploymentModel.kind,
    metadata: {
      namespace,
      name: '',
    },
    spec: {
      selector: { matchLabels: { app: 'name' } },
      replicas: 3,
      template: {
        metadata: {
          labels: { app: 'name' },
        },
        spec: {
          containers: [
            {
              name: 'container',
              image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
            },
          ],
        },
      },
      strategy: {
        type: DeploymentStrategyType.rollingUpdate,
        rollingUpdate: {
          maxSurge: '25%',
          maxUnavailable: '25%',
        },
      },
    },
  };

  return defaultDeployment;
};

export const getContainerNames = (containers: ContainerSpec[]) => {
  return (
    containers?.reduce((acc, container) => {
      return {
        ...acc,
        [container.name]: container.name,
      };
    }, {}) ?? []
  );
};

export const getLchImageStreamData = (
  resName: string,
  resNamespace: string,
  tagImages?: { containerName: string; to: { [key: string]: string } }[],
): LifecycleHookImagestreamData => {
  const imageTagNs = tagImages?.[0]?.to?.namespace ?? '';
  const image = tagImages?.[0]?.to?.name?.split(':') ?? [];
  return {
    name: resName,
    project: { name: resNamespace },
    fromImageStreamTag: true,
    imageStreamTag: {},
    containerName: tagImages?.[0]?.containerName ?? '',
    to: tagImages?.[0]?.to ?? {},
    isSearchingForImage: false,
    imageStream: {
      namespace: imageTagNs || resNamespace,
      image: image[0] ?? '',
      tag: image[1] ?? '',
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
  };
};

export const getLifecycleHookData = (lch: any): LifecycleHookData => {
  return {
    failurePolicy: lch?.failurePolicy ?? FailurePolicyType.Abort,
    execNewPod: {
      command: lch?.execNewPod?.command ?? [''],
      containerName: lch?.execNewPod?.containerName,
      env: lch?.execNewPod?.env,
      volumes: _.join(lch?.execNewPod?.volumes, ','),
    },
    tagImages: lch?.tagImages ?? [],
  };
};

export const getLifecycleHookFormData = (lch: any): LifecycleHookFormData => {
  return {
    lch: getLifecycleHookData(lch),
    exists: !!lch,
    isAddingLch: false,
    action: lch
      ? lch.hasOwnProperty(LifecycleAction.execNewPod)
        ? LifecycleAction.execNewPod
        : LifecycleAction.tagImages
      : LifecycleAction.execNewPod,
  };
};

export const getStrategyData = (
  type: DeploymentStrategyType,
  strategy: any,
  resName: string,
  resNamespace: string,
  resourceType: string,
): DeploymentStrategyData => {
  switch (type) {
    case DeploymentStrategyType.recreateParams: {
      if (resourceType === Resources.Kubernetes) return {};
      const { mid: midHook, post: postHook, pre: preHook, timeoutSeconds } =
        strategy.recreateParams ?? {};
      return {
        recreateParams: {
          timeoutSeconds,
          pre: getLifecycleHookFormData(preHook),
          mid: getLifecycleHookFormData(midHook),
          post: getLifecycleHookFormData(postHook),
        },
        imageStreamData: {
          pre: getLchImageStreamData(resName, resNamespace, preHook?.tagImages),
          mid: getLchImageStreamData(resName, resNamespace, midHook?.tagImages),
          post: getLchImageStreamData(resName, resNamespace, postHook?.tagImages),
        },
      };
    }
    case DeploymentStrategyType.customParams: {
      const { command = [''], environment, image } = strategy.customParams ?? {};
      return {
        customParams: {
          command,
          environment,
          image,
        },
      };
    }
    case DeploymentStrategyType.rollingParams: {
      const {
        post: postHook,
        pre: preHook,
        timeoutSeconds,
        updatePeriodSeconds,
        intervalSeconds,
        maxSurge,
        maxUnavailable,
      } = strategy.rollingParams ?? {};
      return {
        rollingParams: {
          timeoutSeconds,
          pre: getLifecycleHookFormData(preHook),
          post: getLifecycleHookFormData(postHook),
          updatePeriodSeconds,
          intervalSeconds,
          maxSurge,
          maxUnavailable,
        },
        imageStreamData: {
          pre: getLchImageStreamData(resName, resNamespace, preHook?.tagImages),
          post: getLchImageStreamData(resName, resNamespace, postHook?.tagImages),
        },
      };
    }
    case DeploymentStrategyType.rollingUpdate: {
      const { maxSurge, maxUnavailable } = strategy.rollingUpdate ?? {};
      return { rollingUpdate: { maxSurge, maxUnavailable } };
    }
    default:
      return {};
  }
};

export const getStrategy = (
  deployment: K8sResourceKind,
  resourceType: Resources,
): DeploymentStrategy => {
  const { strategy } = deployment.spec ?? {};
  let type: DeploymentStrategyType;

  if (resourceType === Resources.OpenShift) {
    type = strategy?.type ?? DeploymentStrategyType.rollingParams;
    return {
      ..._.omit(strategy, ['rollingParams', 'recreateParams', 'customParams']),
      type,
      ...getStrategyData(
        type,
        strategy,
        deployment.metadata.name,
        deployment.metadata.namespace,
        resourceType,
      ),
    };
  }

  type = strategy?.type ?? DeploymentStrategyType.rollingUpdate;
  return {
    type,
    ...(type === DeploymentStrategyType.rollingUpdate
      ? getStrategyData(
          type,
          strategy,
          deployment.metadata.name,
          deployment.metadata.namespace,
          resourceType,
        )
      : {}),
  };
};

export const getTriggersAndImageStreamValues = (
  deployment: K8sResourceKind,
  resourceType: Resources,
): TriggersAndImageStreamFormData => {
  let imageName: string;
  let imageTrigger;
  const data = {
    isSearchingForImage: false,
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
  };

  if (resourceType === Resources.OpenShift) {
    const triggers = deployment?.spec?.triggers;
    imageTrigger = _.find(triggers, (trigger) => trigger.type === 'ImageChange');
    imageName = imageTrigger?.imageChangeParams.from.name.split(':') ?? [];
    return {
      ...data,
      triggers: {
        image: checkIfTriggerExists(triggers, 'ImageChange', deployment.kind),
        config: checkIfTriggerExists(triggers, 'ConfigChange'),
      },
      fromImageStreamTag: !!imageTrigger,
      imageStream: {
        image: imageName[0] ?? '',
        tag: imageName[1] ?? '',
        namespace: imageTrigger?.imageChangeParams.from.namespace ?? deployment.metadata.namespace,
      },
      project: {
        name: deployment.metadata.namespace,
      },
    };
  }

  imageTrigger = JSON.parse(
    deployment?.metadata?.annotations?.['image.openshift.io/triggers'] ?? '[]',
  )?.[0];
  imageName = imageTrigger?.from?.name?.split(':') ?? [];
  return {
    ...data,
    triggers: {
      image: imageTrigger?.paused === 'false',
    },
    fromImageStreamTag: !!imageTrigger,
    imageStream: {
      image: imageName[0] ?? '',
      tag: imageName[1] ?? '',
      namespace: imageTrigger?.from?.namespace ?? deployment.metadata.namespace,
    },
    project: {
      name: deployment.metadata.namespace,
    },
  };
};

export const convertDeploymentToEditForm = (
  deployment: K8sResourceKind,
): EditDeploymentFormData => {
  const resourceType = getResourcesType(deployment);
  return {
    formType: deployment.metadata.name ? 'edit' : 'create',
    name: deployment.metadata.name ?? '',
    resourceVersion: deployment.metadata.resourceVersion ?? '',
    deploymentStrategy: getStrategy(deployment, resourceType),
    containers: deployment.spec.template?.spec?.containers ?? [],
    imageName: deployment.spec.template?.spec?.containers?.[0]?.image,
    envs: deployment.spec.template?.spec?.containers?.[0]?.env ?? [],
    imagePullSecret: deployment.spec.template?.spec?.imagePullSecrets?.[0]?.name ?? '',
    paused: deployment.spec.paused ?? false,
    replicas: deployment.spec.replicas,
    ...getTriggersAndImageStreamValues(deployment, resourceType),
  };
};

export const getUpdatedContainers = (
  containers: ContainerSpec[],
  fromImageStreamTag: boolean,
  isi: ImageStreamImageData,
  imageName?: string,
  envs?: EnvVar[],
): ContainerSpec[] => {
  const { image } = isi;
  const newContainers: ContainerSpec[] = containers;
  const imageRef = fromImageStreamTag && !_.isEmpty(image) ? image.dockerImageReference : imageName;
  newContainers[0] = {
    ...newContainers[0],
    image: imageRef,
    env: envs,
  };
  return newContainers;
};

export const getUpdatedLchData = (
  lch: LifecycleHookData,
  lchName: string,
  lcAction: string,
  imageStreamData: LifecycleHookImagestreamData,
) => {
  const getUpdatedTagImages = () => {
    const { containerName, to, imageStreamTag } = imageStreamData;
    const { apiVersion, kind, metadata } = imageStreamTag;
    lch.tagImages[0] = {
      containerName,
      to: !_.isEmpty(to)
        ? to
        : {
            apiVersion,
            kind,
            name: metadata?.name,
            namespace: metadata?.namespace,
            resourceVersion: metadata?.resourceVersion,
            uid: metadata?.uid,
          },
    };
    return lch.tagImages;
  };
  return {
    [lchName]: {
      failurePolicy: lch.failurePolicy,
      ...(lcAction === LifecycleAction.execNewPod && {
        execNewPod: {
          containerName: lch.execNewPod.containerName,
          command: lch.execNewPod.command,
          ...(!_.isEmpty(lch.execNewPod.env) ? { env: lch.execNewPod.env } : {}),
          ...(lch.execNewPod.volumes ? { volumes: _.split(lch.execNewPod.volumes, ',') } : {}),
        },
      }),
      ...(lcAction === LifecycleAction.tagImages && {
        tagImages: getUpdatedTagImages(),
      }),
    },
  };
};

export const getUpdatedStrategy = (strategy: DeploymentStrategy, resourceType: string) => {
  const { type, imageStreamData } = strategy;
  const newStrategy = _.omit(strategy, [
    'rollingParams',
    'recreateParams',
    'customParams',
    'imageStreamData',
    'rollingUpdate',
  ]);
  switch (type) {
    case DeploymentStrategyType.recreateParams: {
      const { mid: midHook, post: postHook, pre: preHook, timeoutSeconds } =
        strategy.recreateParams ?? {};
      return {
        ...newStrategy,
        ...(resourceType === Resources.OpenShift
          ? {
              recreateParams: {
                ...(timeoutSeconds ? { timeoutSeconds } : {}),
                ...(preHook.exists
                  ? getUpdatedLchData(preHook.lch, 'pre', preHook.action, imageStreamData.pre)
                  : {}),
                ...(midHook.exists
                  ? getUpdatedLchData(midHook.lch, 'mid', midHook.action, imageStreamData.mid)
                  : {}),
                ...(postHook.exists
                  ? getUpdatedLchData(postHook.lch, 'post', postHook.action, imageStreamData.post)
                  : {}),
              },
            }
          : {}),
      };
    }
    case DeploymentStrategyType.customParams: {
      return {
        ...newStrategy,
        customParams: strategy.customParams,
      };
    }
    case DeploymentStrategyType.rollingParams: {
      const {
        post: postHook,
        pre: preHook,
        maxSurge,
        maxUnavailable,
        timeoutSeconds,
        updatePeriodSeconds,
        intervalSeconds,
      } = strategy.rollingParams;
      return {
        ...newStrategy,
        rollingParams: {
          ...(timeoutSeconds ? { timeoutSeconds } : {}),
          ...(updatePeriodSeconds ? { updatePeriodSeconds } : {}),
          ...(intervalSeconds ? { intervalSeconds } : {}),
          ...(preHook.exists
            ? getUpdatedLchData(preHook.lch, 'pre', preHook.action, imageStreamData.pre)
            : {}),
          ...(postHook.exists
            ? getUpdatedLchData(postHook.lch, 'post', postHook.action, imageStreamData.pre)
            : {}),
          ...(maxSurge
            ? { maxSurge: !_.endsWith(maxSurge, '%') ? parseInt(maxSurge, 10) : maxSurge }
            : {}),
          ...(maxUnavailable
            ? {
                maxUnavailable: !_.endsWith(maxUnavailable, '%')
                  ? parseInt(maxUnavailable, 10)
                  : maxUnavailable,
              }
            : {}),
        },
      };
    }
    case DeploymentStrategyType.rollingUpdate: {
      const { maxSurge, maxUnavailable } = strategy.rollingUpdate;
      return {
        type,
        rollingUpdate: {
          ...(maxSurge
            ? { maxSurge: !_.endsWith(maxSurge, '%') ? parseInt(maxSurge, 10) : maxSurge }
            : {}),
          ...(maxUnavailable
            ? {
                maxUnavailable: !_.endsWith(maxUnavailable, '%')
                  ? parseInt(maxUnavailable, 10)
                  : maxUnavailable,
              }
            : {}),
        },
      };
    }
    default:
      return {};
  }
};

export const convertEditFormToDeployment = (
  formValues: EditDeploymentFormData,
  deployment: K8sResourceKind,
): K8sResourceKind => {
  const {
    name,
    deploymentStrategy,
    containers,
    imageName,
    envs,
    imagePullSecret,
    paused,
    replicas,
    imageStream: { image, tag, namespace: imgNs },
    isi,
    triggers,
    fromImageStreamTag,
    resourceVersion,
  } = formValues;
  const resourceType = getResourcesType(deployment);

  let newDeployment: K8sResourceKind = {
    ...deployment,
    metadata: {
      ...deployment.metadata,
      name,
      ...(resourceVersion ? { resourceVersion } : {}),
    },
    spec: {
      ...deployment.spec,
      paused,
      replicas,
      strategy: getUpdatedStrategy(deploymentStrategy, resourceType),
      template: {
        ...deployment.spec.template,
        metadata: {
          ...deployment.spec.template.metadata,
          labels: {
            ...deployment.spec.template.metadata.labels,
            ...(deployment.metadata.name ? {} : name ? { app: name } : {}),
          },
        },
        spec: {
          ...deployment.spec.template.spec,
          containers: getUpdatedContainers(containers, fromImageStreamTag, isi, imageName, envs),
          imagePullSecrets: [
            ...(deployment.spec.template.spec.imagePullSecrets ?? []),
            ...(imagePullSecret ? [{ name: imagePullSecret }] : []),
          ],
        },
      },
    },
  };

  if (resourceType === Resources.OpenShift) {
    newDeployment = {
      ...newDeployment,
      spec: {
        ...newDeployment.spec,
        selector: {
          ...newDeployment.spec.selector,
          ...(deployment.metadata.name
            ? {}
            : newDeployment.metadata.name
            ? { app: newDeployment.metadata.name }
            : {}),
        },
        triggers: [
          ...(fromImageStreamTag
            ? [
                {
                  type: 'ImageChange',
                  imageChangeParams: {
                    automatic: triggers.image,
                    containerNames: [containers[0].name],
                    from: {
                      kind: 'ImageStreamTag',
                      name: `${image}:${tag}`,
                      namespace: imgNs,
                    },
                  },
                },
              ]
            : []),
          ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
        ],
      },
    };
  } else {
    newDeployment?.metadata?.annotations?.[TRIGGERS_ANNOTATION] &&
      delete newDeployment.metadata.annotations[TRIGGERS_ANNOTATION];
    newDeployment = {
      ...newDeployment,
      metadata: {
        ...newDeployment.metadata,
        annotations: {
          ...newDeployment.metadata.annotations,
          ...(fromImageStreamTag
            ? getTriggerAnnotation(containers[0].name, image, imgNs, triggers.image, tag)
            : {}),
        },
      },
      spec: {
        ...newDeployment.spec,
        selector: {
          ...newDeployment.spec.selector,
          matchLabels: {
            ...newDeployment.spec.selector.matchLabels,
            ...(deployment.metadata.name
              ? {}
              : newDeployment.metadata.name
              ? { app: newDeployment.metadata.name }
              : {}),
          },
        },
      },
    };
  }

  return newDeployment;
};
