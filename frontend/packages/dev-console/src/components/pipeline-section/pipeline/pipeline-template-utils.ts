import type { FormikValues } from 'formik';
import * as _ from 'lodash';
import type { SemVer } from 'semver';
import { compare, gte, parse } from 'semver';
import { k8sGet, k8sList, k8sListResourceItems } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { getActiveUserName } from '@console/internal/actions/ui';
import {
  ClusterServiceVersionModel,
  RouteModel,
  SecretModel,
  ServiceAccountModel,
  ServiceModel,
  StorageClassModel,
} from '@console/internal/models';
import type { K8sResourceCommon, K8sResourceKind, RouteKind } from '@console/internal/module/k8s';
import { apiVersionForModel, k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import type { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src/types';
import { ClusterServiceVersionPhase } from '@console/operator-lifecycle-manager/src/types';
import type {
  NameValueFromPair,
  NameValuePair,
} from '@console/shared/src/components/formik-fields/field-types';
import { launchErrorModal } from '@console/shared/src/utils/error-modal-handler';
import { getRandomChars } from '@console/shared/src/utils/utils';
import { TektonResourceLabel } from '@console/shipwright-plugin/src/components/logs/TektonTaskRunLog';
import {
  PIPELINE_RUNTIME_LABEL,
  PIPELINE_RUNTIME_VERSION_LABEL,
  PIPELINE_SERVICE_ACCOUNT,
  PIPELINE_STRATEGY_LABEL,
  preferredNameAnnotation,
} from '../../../const';
import {
  ClusterTriggerBindingModel,
  PipelineModel,
  PipelineResourceModel,
  PipelineRunModel,
  EventListenerModel,
  TriggerTemplateModel,
} from '../../../models/pipelines';
import type { TektonParam, TektonResource, TektonWorkspace } from '../../../types/coreTekton';
import type {
  PipelineKind,
  PipelineRunEmbeddedResourceParam,
  PipelineRunKind,
  PipelineRunParam,
  PipelineRunWorkspace,
  VolumeTypeClaim,
  VolumeTypeConfigMaps,
  VolumeTypePVC,
  VolumeTypeSecret,
} from '../../../types/pipeline';
import { VolumeTypes } from '../../../types/pipeline';
import type { PipelineData } from '../import-types';
import type {
  TriggerBindingKind,
  TriggerTemplateKind,
  TriggerTemplateKindParam,
  EventListenerKind,
  EventListenerKindBindingReference,
} from '../triggers';
import { initialResourceFormValues } from './const';

export const CREATE_PIPELINE_RESOURCE = '#CREATE_PIPELINE_RESOURCE#';
const PIPELINE_GA_VERSION = '1.4.0';
export interface ParamData {
  [key: string]: any;
}

/**
 * Migrates a PipelineRun from one version to another to support auto-upgrades with old (and invalid) PipelineRuns.
 *
 * Note: Each check within this method should be driven by the apiVersion number if the API is properly up-versioned
 * for these breaking changes. (should be done moving from 0.10.x forward)
 */
export const migratePipelineRun = (pipelineRun: PipelineRunKind): PipelineRunKind => {
  let newPipelineRun = pipelineRun;

  const serviceAccountPath = 'spec.serviceAccount';
  if (_.has(newPipelineRun, serviceAccountPath)) {
    // .spec.serviceAccount was removed for .spec.serviceAccountName in 0.9.x
    // Note: apiVersion was not updated for this change and thus we cannot gate this change behind a version number
    const serviceAccountName = _.get(newPipelineRun, serviceAccountPath);
    newPipelineRun = _.omit(newPipelineRun, [serviceAccountPath]);
    newPipelineRun = _.merge(newPipelineRun, {
      spec: {
        serviceAccountName,
      },
    });
  }

  return newPipelineRun;
};

export const getPipelineName = (pipeline?: PipelineKind, latestRun?: PipelineRunKind): string => {
  if (pipeline) {
    return pipeline?.metadata?.name || '';
  }

  if (latestRun) {
    return (
      latestRun.spec.pipelineRef?.name ??
      (latestRun?.metadata?.annotations?.[preferredNameAnnotation] || latestRun?.metadata?.name)
    );
  }
  return null;
};

export const getPipelineRunGenerateName = (pipelineRun: PipelineRunKind): string => {
  if (pipelineRun?.metadata?.generateName) {
    return pipelineRun.metadata.generateName;
  }

  return `${pipelineRun?.metadata?.name?.replace(/-[a-z0-9]{5,6}$/, '')}-`;
};

export const getPipelineRunParams = (pipelineParams: TektonParam[]): PipelineRunParam[] => {
  return (
    pipelineParams &&
    pipelineParams.map((param) => ({
      name: param.name,
      value: param.default,
    }))
  );
};

export const getPipelineRunWorkspaces = (
  pipelineWorkspaces: PipelineModalFormWorkspace[],
): PipelineRunWorkspace[] => {
  return (
    pipelineWorkspaces &&
    pipelineWorkspaces.map((workspace) => ({
      name: workspace.name,
      ...workspace.data,
    }))
  );
};

export enum StartedByAnnotation {
  user = 'pipeline.openshift.io/started-by',
}

export type VolumeClaimTemplateType = {
  volumeClaimTemplate: VolumeTypeClaim;
};

interface ServiceAccountSecretNames {
  [name: string]: string;
}

export type ServiceAccountType = {
  secrets: ServiceAccountSecretNames[];
  imagePullSecrets: ServiceAccountSecretNames[];
} & K8sResourceCommon;

const getImageUrl = (name: string, namespace: string) => {
  return `image-registry.openshift-image-registry.svc:5000/${namespace}/${name}`;
};

export const getDefinedObj = (objData: ParamData): ParamData => {
  return _.omitBy(objData, (v) => _.isUndefined(v) || _.isNull(v) || v === '');
};

export type PipelineModalFormResource = {
  name: string;
  selection: string;
  data: {
    type: string;
    params: { [key: string]: string };
    secrets?: { [key: string]: string };
  };
};

export type PipelineModalFormWorkspaceStructure =
  | {
      type: VolumeTypes.NoWorkspace;
      data: {};
    }
  | {
      type: VolumeTypes.EmptyDirectory;
      data: {
        emptyDir: {};
      };
    }
  | {
      type: VolumeTypes.Secret;
      data: {
        secret: VolumeTypeSecret;
      };
    }
  | {
      type: VolumeTypes.ConfigMap;
      data: {
        configMap: VolumeTypeConfigMaps;
      };
    }
  | {
      type: VolumeTypes.PVC;
      data: {
        persistentVolumeClaim: VolumeTypePVC;
      };
    }
  | {
      type: VolumeTypes.VolumeClaimTemplate;
      data: {
        volumeClaimTemplate: VolumeTypeClaim;
      };
    };

export type PipelineModalFormWorkspace = TektonWorkspace & PipelineModalFormWorkspaceStructure;

export type ModalParameter = TektonParam & {
  value?: string | string[];
};

export type CommonPipelineModalFormikValues = FormikValues & {
  namespace: string;
  parameters: ModalParameter[];
  workspaces: PipelineModalFormWorkspace[];
};

export type AddTriggerFormValues = CommonPipelineModalFormikValues & {
  triggerBinding: {
    name: string;
    resource: TriggerBindingKind;
  };
};

export type StartPipelineFormValues = CommonPipelineModalFormikValues & {
  secretOpen: boolean;
};

export const getPipelineOperatorVersion = async (namespace: string): Promise<SemVer | null> => {
  const allCSVs: ClusterServiceVersionKind[] = await k8sList(ClusterServiceVersionModel, {
    ns: namespace,
  });
  const matchingCSVs = allCSVs.filter(
    (csv) =>
      (csv.metadata?.name?.startsWith('openshift-pipelines-operator') ||
        csv.metadata?.name?.startsWith('redhat-openshift-pipelines')) &&
      csv.status?.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded,
  );
  const versions = matchingCSVs.map((csv) => parse(csv.spec.version)).filter(Boolean);
  // Orders from small (oldest) to highest (newest) version
  versions.sort(compare);
  if (versions.length > 0) {
    return versions[versions.length - 1];
  }
  return null;
};

export const isGAVersionInstalled = (operator: SemVer): boolean => {
  if (!operator) return false;
  return gte(operator.version, PIPELINE_GA_VERSION);
};

export const getPipelineRunData = (
  pipeline: PipelineKind = null,
  latestRun?: PipelineRunKind,
  options?: { generateName: boolean },
): PipelineRunKind => {
  if (!pipeline && !latestRun) {
    // eslint-disable-next-line no-console
    console.error('Missing parameters, unable to create new PipelineRun');
    return null;
  }

  const pipelineName = getPipelineName(pipeline, latestRun);

  const workspaces = latestRun?.spec.workspaces;

  const latestRunParams = latestRun?.spec.params;
  const pipelineParams = pipeline?.spec.params;
  const params = latestRunParams || getPipelineRunParams(pipelineParams);
  // TODO: We should craft a better method to allow us to provide configurable annotations and labels instead of
  // blinding merging existing content from potential real Pipeline and PipelineRun resources
  const annotations = _.merge(
    {},
    pipeline?.metadata?.annotations,
    latestRun?.metadata?.annotations,
    {
      [StartedByAnnotation.user]: getActiveUserName(),
    },
    !latestRun?.spec.pipelineRef &&
      !latestRun?.metadata.annotations?.[preferredNameAnnotation] && {
        [preferredNameAnnotation]: pipelineName,
      },
  );
  delete annotations['kubectl.kubernetes.io/last-applied-configuration'];
  delete annotations['tekton.dev/v1beta1TaskRuns'];
  delete annotations['results.tekton.dev/log'];
  delete annotations['results.tekton.dev/record'];
  delete annotations['results.tekton.dev/result'];
  delete annotations['resource.deleted.in.k8s'];
  delete annotations['resource.loaded.from.tektonResults'];

  const newPipelineRun = {
    apiVersion: pipeline ? pipeline.apiVersion : latestRun.apiVersion,
    kind: PipelineRunModel.kind,
    metadata: {
      ...(options?.generateName
        ? {
            generateName: `${pipelineName}-`,
          }
        : {
            name:
              latestRun?.metadata?.name !== undefined
                ? `${getPipelineRunGenerateName(latestRun)}${getRandomChars()}`
                : `${pipelineName}-${getRandomChars()}`,
          }),
      annotations,
      namespace: pipeline ? pipeline.metadata.namespace : latestRun.metadata.namespace,
      labels: _.merge(
        {},
        pipeline?.metadata?.labels,
        latestRun?.metadata?.labels,
        (latestRun?.spec.pipelineRef || pipeline) && {
          'tekton.dev/pipeline': pipelineName,
        },
      ),
    },
    spec: {
      ...(latestRun?.spec || {}),
      ...((latestRun?.spec.pipelineRef || pipeline) && {
        pipelineRef: latestRun?.spec.pipelineRef?.resolver
          ? {
              resolver: latestRun.spec.pipelineRef?.resolver,
              params: latestRun.spec.pipelineRef?.params,
            }
          : {
              name: pipelineName,
            },
      }),
      ...(params && { params }),
      workspaces,
      status: null,
    },
  };
  return migratePipelineRun(newPipelineRun);
};

export const getPipelineRunFromForm = (
  pipeline: PipelineKind,
  formValues: CommonPipelineModalFormikValues,
  labels?: { [key: string]: string },
  annotations?: { [key: string]: string },
  options?: { generateName: boolean },
) => {
  const { parameters, workspaces } = formValues;

  const pipelineRunData: PipelineRunKind = {
    metadata: {
      annotations,
      labels,
    },
    spec: {
      pipelineRef: {
        name: pipeline?.metadata?.name,
      },
      params: parameters.map(({ name, value }): PipelineRunParam => ({ name, value })),
      workspaces: getPipelineRunWorkspaces(workspaces),
    },
  };
  return getPipelineRunData(pipeline, pipelineRunData, options);
};

const supportWorkspaceDefaults = (preselectPVC: string) => (
  workspace: TektonWorkspace,
): PipelineModalFormWorkspace => {
  let workspaceSetting: PipelineModalFormWorkspaceStructure = {
    type: VolumeTypes.EmptyDirectory,
    data: { emptyDir: {} },
  };

  if (preselectPVC) {
    workspaceSetting = {
      type: VolumeTypes.PVC,
      data: {
        persistentVolumeClaim: {
          claimName: preselectPVC,
        },
      },
    };
  }
  if (workspace.optional) {
    workspaceSetting = {
      type: VolumeTypes.NoWorkspace,
      data: {},
    };
  }

  return {
    ...workspace,
    ...workspaceSetting,
  };
};

export const convertPipelineToModalData = (
  pipeline: PipelineKind,
  alwaysCreateResources: boolean = false,
  preselectPVC: string = '',
): CommonPipelineModalFormikValues => {
  const {
    metadata: { namespace },
    spec: { params, resources },
  } = pipeline;

  return {
    namespace,
    parameters: (params || []).map((param) => ({
      ...param,
      value: param.default, // setup the default if it exists
    })),
    resources: (resources || []).map((resource: TektonResource) => ({
      name: resource.name,
      selection: alwaysCreateResources ? CREATE_PIPELINE_RESOURCE : '',
      data: {
        ...initialResourceFormValues[resource.type],
        type: resource.type,
      },
    })),
    workspaces: (pipeline.spec.workspaces || []).map(supportWorkspaceDefaults(preselectPVC)),
  };
};

export const getServerlessFunctionDefaultPersistentVolumeClaim = async (
  pipelineName: string,
): Promise<VolumeClaimTemplateType> => {
  const storageClasses: K8sResourceCommon[] = await k8sListResourceItems<K8sResourceCommon>({
    model: StorageClassModel,
    queryParams: {},
  });
  const defaultStorageClass = storageClasses?.find((storageClass) => {
    return (
      storageClass.metadata?.annotations?.['storageclass.kubernetes.io/is-default-class'] === 'true'
    );
  });
  const defaultStorageClassName = defaultStorageClass?.metadata?.name;
  return {
    volumeClaimTemplate: {
      metadata: {
        finalizers: ['kubernetes.io/pvc-protection'],
        labels: {
          [TektonResourceLabel.pipeline]: pipelineName,
          'boson.dev/function': 'true',
          'function.knative.dev': 'true',
          'function.knative.dev/name': pipelineName,
        },
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
        storageClassName: defaultStorageClassName,
        volumeMode: 'Filesystem',
      },
    },
  };
};

export const getDefaultVolumeClaimTemplate = (pipelineName: string): VolumeClaimTemplateType => {
  return {
    volumeClaimTemplate: {
      metadata: {
        labels: { [TektonResourceLabel.pipeline]: pipelineName },
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
      },
    },
  };
};

export const convertMapToNameValueArray = (map: {
  [key: string]: any;
}): PipelineRunEmbeddedResourceParam[] => {
  return Object.keys(map).map((name) => {
    const value = map[name];
    return { name, value };
  });
};

const processWorkspaces = (values: StartPipelineFormValues): StartPipelineFormValues => {
  const { workspaces } = values;

  if (!workspaces || workspaces.length === 0) return values;

  return {
    ...values,
    workspaces: workspaces.filter((workspace) => workspace.type !== VolumeTypes.NoWorkspace),
  };
};

export const createSecretResource = (
  secret: ParamData,
  type: string,
  namespace: string,
): Promise<K8sResourceKind> => {
  const resourceName = `${type}-secret-${getRandomChars(6)}`;
  const secretResource = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: resourceName,
      namespace,
    },
    stringData: getDefinedObj(secret),
  };
  return k8sCreate(SecretModel, secretResource);
};

export const createPipelineResource = (
  params: ParamData,
  type: string,
  namespace: string,
  secretResp?: K8sResourceKind,
): Promise<K8sResourceKind> => {
  const resourceName = `${type}-${getRandomChars(6)}`;
  const pipelineResource: K8sResourceKind = {
    apiVersion: 'tekton.dev/v1alpha1',
    kind: 'PipelineResource',
    metadata: {
      name: resourceName,
      namespace,
    },
    spec: {
      type,
      params: convertMapToNameValueArray(getDefinedObj(params)),
      ...(secretResp && {
        secrets: _.map(secretResp.data, (value, name) => {
          return {
            fieldName: name,
            secretKey: name,
            secretName: secretResp?.metadata?.name,
          };
        }),
      }),
    },
  };

  return k8sCreate(PipelineResourceModel, pipelineResource);
};

export const resourceSubmit = async (
  resourceValues: PipelineModalFormResource,
  namespace: string,
): Promise<K8sResourceCommon> => {
  const {
    data: { params, secrets, type },
  } = resourceValues;

  return secrets
    ? createSecretResource(secrets, type, namespace).then((secretResp) => {
        return createPipelineResource(params, type, namespace, secretResp);
      })
    : createPipelineResource(params, type, namespace);
};

const processResources = async (
  values: StartPipelineFormValues,
): Promise<StartPipelineFormValues> => {
  const { namespace, resources } = values;

  const toCreateResources: { [index: string]: PipelineModalFormResource } = resources.reduce(
    (acc, resource, index) => {
      return resource.selection === CREATE_PIPELINE_RESOURCE ? { ...acc, [index]: resource } : acc;
    },
    {},
  );
  const createdResources = await Promise.all(
    Object.values(toCreateResources).map((resource) => resourceSubmit(resource, namespace)),
  );
  if (!createdResources || createdResources.length === 0) return values;

  const indexLookup = Object.keys(toCreateResources);
  return {
    ...values,
    resources: resources.map(
      (resource, index): PipelineModalFormResource => {
        if (toCreateResources[index]) {
          const creationIndex = indexLookup.indexOf(index.toString());
          return {
            ...resource,
            selection: createdResources?.[creationIndex]?.metadata?.name,
          };
        }
        return resource;
      },
    ),
  };
};

export const submitStartPipeline = async (
  values: StartPipelineFormValues,
  pipeline: PipelineKind,
  labels?: { [key: string]: string },
  annotations?: { [key: string]: string },
): Promise<PipelineRunKind> => {
  let formValues = values;
  formValues = await processResources(formValues);
  formValues = processWorkspaces(formValues);

  const pipelineRunResource: PipelineRunKind = await k8sCreate(
    PipelineRunModel,
    getPipelineRunFromForm(pipeline, formValues, labels, annotations),
  );

  return Promise.resolve(pipelineRunResource);
};

export const createGitResource = (url: string, namespace: string, ref: string = 'master') => {
  const params = { url, revision: ref };
  return createPipelineResource(params, 'git', namespace);
};

export const createImageResource = (name: string, namespace: string) => {
  const params = {
    url: getImageUrl(name, namespace),
  };

  return createPipelineResource(params, 'image', namespace);
};

export const getPipelineParams = (
  params: TektonParam[],
  name: string,
  namespace: string,
  gitUrl: string,
  gitRef: string,
  gitDir: string,
  dockerfilePath: string,
  tag: string,
  buildEnv: any,
) => {
  return (params || []).map((param) => {
    switch (param.name) {
      case 'APP_NAME':
        return { ...param, default: name };
      case 'GIT_REPO':
        return { ...param, default: gitUrl };
      case 'GIT_REVISION':
        return { ...param, default: gitRef || '' };
      case 'PATH_CONTEXT':
        return { ...param, default: gitDir.replace(/^\//, '') || param.default };
      case 'IMAGE_NAME':
        return { ...param, default: getImageUrl(name, namespace) };
      case 'DOCKERFILE':
        return { ...param, default: dockerfilePath };
      case 'VERSION':
        return { ...param, default: tag || param.default };
      case 'BUILD_ENVS':
        return { ...param, default: buildEnv || param.default };
      default:
        return param;
    }
  });
};

export const pipelineRuntimeOrVersionChanged = (
  template: PipelineKind,
  pipeline: PipelineKind,
): boolean =>
  template.metadata?.labels[PIPELINE_RUNTIME_LABEL] !==
    pipeline.metadata?.labels[PIPELINE_RUNTIME_LABEL] ||
  template.metadata?.labels[PIPELINE_RUNTIME_VERSION_LABEL] !==
    pipeline.metadata?.labels[PIPELINE_RUNTIME_VERSION_LABEL];

export const isDockerPipeline = (template: PipelineKind): boolean =>
  template?.metadata?.labels?.[PIPELINE_STRATEGY_LABEL] === 'docker';

export const createPipelineForImportFlow = async (
  name: string,
  namespace: string,
  gitUrl: string,
  gitRef: string,
  gitDir: string,
  pipeline: PipelineData,
  dockerfilePath: string,
  tag: string,
  buildEnv: (NameValuePair | NameValueFromPair)[],
  labels: { [key: string]: string } = {},
) => {
  const template = _.cloneDeep(pipeline.template);

  template.metadata = {
    name: `${name}`,
    namespace,
    labels: {
      ...template.metadata?.labels,
      ...labels,
      'app.kubernetes.io/instance': name,
      'app.kubernetes.io/name': name,
      ...(!isDockerPipeline(template) && {
        [PIPELINE_RUNTIME_VERSION_LABEL]: tag,
      }),
    },
  };

  template.spec.params =
    template.spec.params &&
    getPipelineParams(
      template.spec.params,
      name,
      namespace,
      gitUrl,
      gitRef,
      gitDir,
      dockerfilePath,
      tag,
      buildEnv,
    );

  return k8sCreate(PipelineModel, template, { ns: namespace });
};

export const createPipelineRunForImportFlow = async (
  pipeline: PipelineKind,
): Promise<PipelineRunKind> => {
  const isServerlessFunctionPipeline =
    pipeline?.metadata?.labels?.['function.knative.dev'] === 'true';
  const defaultPVC = isServerlessFunctionPipeline
    ? await getServerlessFunctionDefaultPersistentVolumeClaim(pipeline?.metadata?.name)
    : getDefaultVolumeClaimTemplate(pipeline?.metadata?.name);
  const pipelineInitialValues: StartPipelineFormValues = {
    ...convertPipelineToModalData(pipeline),
    workspaces: (pipeline.spec.workspaces || []).map((workspace: TektonWorkspace) => ({
      ...workspace,
      type: VolumeTypes.VolumeClaimTemplate,
      data: defaultPVC,
    })),
    secretOpen: false,
  };
  return submitStartPipeline(pipelineInitialValues, pipeline);
};
export const updatePipelineForImportFlow = async (
  pipeline: PipelineKind,
  template: PipelineKind,
  name: string,
  namespace: string,
  gitUrl: string,
  gitRef: string,
  gitDir: string,
  dockerfilePath: string,
  tag: string,
  buildEnv: (NameValuePair | NameValueFromPair)[],
  labels: { [key: string]: string } = {},
): Promise<PipelineKind> => {
  let updatedPipeline = _.cloneDeep(pipeline);

  if (!template) {
    updatedPipeline.metadata.labels = _.omit(
      { ...updatedPipeline?.metadata?.labels, ...labels },
      'app.kubernetes.io/instance',
    );
  } else {
    if (pipelineRuntimeOrVersionChanged(template, pipeline)) {
      updatedPipeline = _.cloneDeep(template);
      updatedPipeline.metadata = {
        resourceVersion: pipeline?.metadata?.resourceVersion,
        name: `${name}`,
        namespace,
        labels: {
          ...template.metadata?.labels,
          ...labels,
          'app.kubernetes.io/instance': name,
          'app.kubernetes.io/name': name,
          ...(!isDockerPipeline(template) && { [PIPELINE_RUNTIME_VERSION_LABEL]: tag }),
        },
      };
    }

    updatedPipeline.spec.params = getPipelineParams(
      template.spec.params,
      name,
      namespace,
      gitUrl,
      gitRef,
      gitDir,
      dockerfilePath,
      tag,
      buildEnv,
    );
  }
  return k8sUpdate(PipelineModel, updatedPipeline, namespace, name);
};

export const createEventListener = (
  triggerBindings: TriggerBindingKind[],
  triggerTemplate: TriggerTemplateKind,
  pipelineOperatorVersion: SemVer,
): EventListenerKind => {
  const mapTriggerBindings: (
    triggerBinding: TriggerBindingKind,
  ) => EventListenerKindBindingReference = (triggerBinding: TriggerBindingKind) => {
    // The Tekton CRD `EventListeners` before Tekton Triggers 0.5 requires a name
    // instead of a ref here to link `TriggerBinding` or `ClusterTriggerBinding`.
    if (
      pipelineOperatorVersion?.major === 0 ||
      (pipelineOperatorVersion?.major === 1 && pipelineOperatorVersion?.minor === 0)
    ) {
      return {
        kind: triggerBinding.kind,
        name: triggerBinding.metadata.name,
      } as EventListenerKindBindingReference;
    }
    return {
      kind: triggerBinding.kind,
      ref: triggerBinding.metadata.name,
    };
  };
  const getTriggerTemplate = (name: string) => {
    if (!isGAVersionInstalled(pipelineOperatorVersion)) {
      return {
        name,
      };
    }
    return { ref: name };
  };

  return {
    apiVersion: apiVersionForModel(EventListenerModel),
    kind: EventListenerModel.kind,
    metadata: {
      name: `event-listener-${getRandomChars()}`,
    },
    spec: {
      serviceAccountName: PIPELINE_SERVICE_ACCOUNT,
      triggers: [
        {
          bindings: triggerBindings.map(mapTriggerBindings),
          template: getTriggerTemplate(triggerTemplate.metadata.name),
        },
      ],
    },
  };
};

export const createEventListenerRoute = (
  eventListener: EventListenerKind,
  generatedName?: string,
  targetPort: number | string = 8080,
): RouteKind => {
  const eventListenerName = eventListener.metadata.name;
  // Not ideal, but if all else fails, we can do our best guess
  const referenceName = generatedName || `el-${eventListenerName}`;

  return {
    apiVersion: apiVersionForModel(RouteModel),
    kind: RouteModel.kind,
    metadata: {
      name: referenceName,
      labels: {
        'app.kubernetes.io/managed-by': EventListenerModel.kind,
        'app.kubernetes.io/part-of': 'Triggers',
        eventlistener: eventListenerName,
      },
    },
    spec: {
      port: {
        targetPort,
      },
      to: {
        kind: 'Service',
        name: referenceName,
        weight: 100,
      },
    },
  };
};

export const createTriggerTemplate = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind,
  params: TriggerTemplateKindParam[],
): TriggerTemplateKind => {
  return {
    apiVersion: apiVersionForModel(TriggerTemplateModel),
    kind: TriggerTemplateModel.kind,
    metadata: {
      name: `trigger-template-${pipeline?.metadata?.name}-${getRandomChars()}`,
    },
    spec: {
      params,
      resourcetemplates: [pipelineRun],
    },
  };
};

export const exposeRoute = async (elName: string, ns: string, iteration = 0) => {
  const elResource: EventListenerKind = await k8sGet(EventListenerModel, elName, ns);
  const serviceGeneratedName = elResource?.status?.configuration?.generatedName;

  try {
    if (!serviceGeneratedName) {
      if (iteration < 3) {
        setTimeout(() => exposeRoute(elName, ns, iteration + 1), 500);
      } else {
        // Unable to deterministically create the route; create a default one
        await k8sCreate(RouteModel, createEventListenerRoute(elResource), { ns });
      }
      return;
    }

    // Get the service, find out what port we are exposed on
    const serviceResource = await k8sGet(ServiceModel, serviceGeneratedName, ns);
    const servicePort = serviceResource.spec?.ports?.[0]?.name;

    // Build the exposed route on the correct port
    const route: RouteKind = createEventListenerRoute(
      elResource,
      serviceGeneratedName,
      servicePort,
    );
    await k8sCreate(RouteModel, route, { ns });
  } catch (e) {
    launchErrorModal({
      title: 'Error Exposing Route',
      error: e.message || 'Unknown error exposing the Webhook route',
    });
  }
};

export const submitTrigger = async (
  pipeline: PipelineKind,
  formValues: AddTriggerFormValues,
): Promise<K8sResourceKind[]> => {
  const { triggerBinding } = formValues;
  const thisNamespace = pipeline.metadata.namespace;

  const pipelineRun: PipelineRunKind = getPipelineRunFromForm(pipeline, formValues, null, null, {
    generateName: true,
  });
  const triggerTemplateParams: TriggerTemplateKindParam[] = triggerBinding.resource.spec.params.map(
    ({ name }) => ({ name } as TriggerTemplateKindParam),
  );
  const triggerTemplate: TriggerTemplateKind = createTriggerTemplate(
    pipeline,
    pipelineRun,
    triggerTemplateParams,
  );
  const pipelineOperatorVersion = await getPipelineOperatorVersion(thisNamespace);
  const eventListener: EventListenerKind = createEventListener(
    [triggerBinding.resource],
    triggerTemplate,
    pipelineOperatorVersion,
  );
  const metadata = { ns: thisNamespace };
  let resources: K8sResourceKind[];
  try {
    // Validates the modal contents, should be done first
    const ttResource = await k8sCreate(TriggerTemplateModel, triggerTemplate, metadata);

    // Creates the linkages and will provide the link to non-trigger resources created
    const elResource = await k8sCreate(EventListenerModel, eventListener, metadata);

    // Capture all related resources
    resources = [ttResource, elResource];
  } catch (err) {
    return Promise.reject(err);
  }

  exposeRoute(eventListener?.metadata?.name, thisNamespace);

  return Promise.resolve(resources);
};

export const createTrigger = async (
  pipeline: PipelineKind,
  gitDetectedType: string,
): Promise<K8sResourceKind[]> => {
  const createdResources: K8sResourceKind[] = [];
  const defaultTriggerBinding = gitDetectedType ? `${gitDetectedType}-push` : 'github-push';
  const clusterTriggerBinding = await k8sGet(ClusterTriggerBindingModel, defaultTriggerBinding);
  if (clusterTriggerBinding) {
    const triggerValues: AddTriggerFormValues = {
      ...convertPipelineToModalData(pipeline),
      workspaces: (pipeline.spec.workspaces || []).map((workspace: TektonWorkspace) => ({
        ...workspace,
        type: VolumeTypes.VolumeClaimTemplate,
        data: getDefaultVolumeClaimTemplate(pipeline?.metadata?.name),
      })),
      triggerBinding: {
        name: defaultTriggerBinding,
        resource: clusterTriggerBinding,
      },
    };
    const resources = await submitTrigger(pipeline, triggerValues);
    createdResources.push(...resources);
  }
  return Promise.resolve(createdResources);
};

export const updateServiceAccount = (
  secretName: string,
  originalServiceAccount: ServiceAccountType,
  updateImagePullSecrets: boolean,
): Promise<ServiceAccountType> => {
  const updatedServiceAccount = _.cloneDeep(originalServiceAccount);
  updatedServiceAccount.secrets = [...(updatedServiceAccount.secrets || []), { name: secretName }];
  if (updateImagePullSecrets) {
    updatedServiceAccount.imagePullSecrets = [
      ...(updatedServiceAccount.imagePullSecrets || []),
      { name: secretName },
    ];
  }
  return k8sUpdate(ServiceAccountModel, updatedServiceAccount);
};

type KeyValuePair = {
  key: string;
  value: string;
};

export enum SecretAnnotationId {
  Git = 'git',
  Image = 'docker',
}

const getAnnotationKey = (secretType: string, suffix: number) => {
  const annotationPrefix = 'tekton.dev';
  if (secretType === SecretAnnotationId.Git) {
    return `${annotationPrefix}/${SecretAnnotationId.Git}-${suffix}`;
  }
  if (secretType === SecretAnnotationId.Image) {
    return `${annotationPrefix}/${SecretAnnotationId.Image}-${suffix}`;
  }
  return null;
};

export const getSecretAnnotations = (
  annotation: KeyValuePair,
  existingAnnotations: { [key: string]: string } = {},
) => {
  let count = 0;
  let annotationKey = getAnnotationKey(annotation?.key, count);
  if (!annotationKey) {
    return existingAnnotations;
  }
  while (
    existingAnnotations[annotationKey] &&
    existingAnnotations[annotationKey] !== annotation?.value
  ) {
    annotationKey = getAnnotationKey(annotation?.key, ++count);
  }

  return { ...existingAnnotations, [annotationKey]: annotation?.value };
};

export const getAllNotStartedPipelines = (): { [ns: string]: string[] } => {
  try {
    return JSON.parse(sessionStorage.getItem('bridge/pipeline-run-auto-start-failed') ?? '{}');
  } catch (e) {
    return {};
  }
};

export const setPipelineNotStarted = (pipelineName: string, namespace: string): void => {
  if (!pipelineName || !namespace) return;
  const pipelineData = getAllNotStartedPipelines();

  if (!pipelineData[namespace]) {
    pipelineData[namespace] = [];
  }
  if (!pipelineData[namespace].includes(pipelineName)) {
    pipelineData[namespace].push(pipelineName);
    sessionStorage.setItem('bridge/pipeline-run-auto-start-failed', JSON.stringify(pipelineData));
  }
};
