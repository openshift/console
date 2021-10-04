import { FormikValues } from 'formik';
import { ContainerSpec, EnvVar, K8sResourceKind } from '@console/internal/module/k8s';
import { ImageStreamImageData, ProjectData } from '../../import/import-types';

export interface LifecycleHookData {
  failurePolicy: string;
  execNewPod?: {
    command: string[];
    containerName: string;
    env?: EnvVar[];
    volumes?: string;
  };
  tagImages?: {
    containerName: string;
    to: { [key: string]: string };
  }[];
}

export interface LifecycleHookImagestreamData {
  imageStream: { namespace: string; image: string; tag: string };
  isi: ImageStreamImageData;
  image: ImageStreamImageData;
  project: ProjectData;
  name: string;
  fromImageStreamTag: boolean;
  imageStreamTag: K8sResourceKind;
  containerName: string;
  to: { [key: string]: string };
  isSearchingForImage: boolean;
}
export interface LifecycleHookFormData {
  lch?: LifecycleHookData;
  exists: boolean;
  isAddingLch: boolean;
  action: string;
}
export interface CommonStrategyParamsData {
  timeoutSeconds?: number;
  pre?: LifecycleHookFormData;
  post?: LifecycleHookFormData;
  mid?: LifecycleHookFormData;
  updatePeriodSeconds?: number;
  intervalSeconds?: number;
  maxSurge?: string;
  maxUnavailable?: string;
}

export interface CustomStrategyParamsData {
  command?: string[];
  environment?: EnvVar[];
  image?: string;
}

export interface DeploymentStrategyData {
  recreateParams?: CommonStrategyParamsData;
  customParams?: CustomStrategyParamsData;
  rollingParams?: CommonStrategyParamsData;
  rollingUpdate?: CommonStrategyParamsData;
  imageStreamData?: {
    pre?: LifecycleHookImagestreamData;
    mid?: LifecycleHookImagestreamData;
    post?: LifecycleHookImagestreamData;
  };
}

export interface DeploymentStrategy extends DeploymentStrategyData {
  type: string;
  [key: string]: any;
}

export interface TriggersAndImageStreamFormData {
  triggers?: { image?: boolean; config?: boolean };
  fromImageStreamTag: boolean;
  isSearchingForImage: boolean;
  imageStream?: { namespace: string; image: string; tag: string };
  project: { name: string };
  isi?: ImageStreamImageData;
  image?: ImageStreamImageData;
}
export interface EditDeploymentFormData extends TriggersAndImageStreamFormData {
  name: string;
  project: ProjectData;
  resourceVersion: string;
  deploymentStrategy: DeploymentStrategy;
  containers: ContainerSpec[];
  imageName?: string;
  envs?: EnvVar[];
  imagePullSecret?: string;
  paused?: boolean;
  replicas?: number;
}

export interface EditDeploymentData {
  editorType: string;
  yamlData: string;
  formData: EditDeploymentFormData;
  formReloadCount?: number;
}

export type EditDeploymentFormikValues = FormikValues & EditDeploymentData;
