import { ValidatedOptions } from '@patternfly/react-core';
import { WatchK8sResultsObject } from '@console/internal/components/utils/k8s-watch-hook';
import { DeploymentModel, DeploymentConfigModel } from '@console/internal/models';
import { K8sResourceKind, ContainerPort } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/knative-plugin/src/models';
import { PipelineData } from '@console/pipelines-plugin/src/components/import/import-types';
import { LazyLoader } from '@console/plugin-sdk';
import { NameValuePair, NameValueFromPair, LimitsData } from '@console/shared';
import { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import { HealthCheckFormProbe } from '../health-checks/health-checks-types';

export interface DeployImageFormProps {
  builderImages?: NormalizedBuilderImages;
  projects?: FirehoseList | WatchK8sResultsObject<K8sResourceKind[]>;
}
export type ImageStreamPayload = boolean | K8sResourceKind;

export type ImageStreamState = {
  accessLoading: ImageStreamPayload;
  loading: ImageStreamPayload;
  selectedImageStream: ImageStreamPayload;
};
export enum ImageStreamActions {
  setAccessLoading = 'setAccessLoading',
  setLoading = 'setLoading',
  setSelectedImageStream = 'setSelectedImageStream',
}
export type ImageStreamAction = { type: ImageStreamActions; value: ImageStreamPayload };
export interface ImageStreamContextProps {
  state: ImageStreamState;
  dispatch: React.Dispatch<ImageStreamAction>;
  hasImageStreams: boolean;
  setHasImageStreams: (value: boolean) => void;
  setValidated: (validated: ValidatedOptions) => void;
}
export interface SourceToImageFormProps {
  builderImages?: NormalizedBuilderImages;
  projects?: {
    data: [];
    loaded: boolean;
  };
}

export interface GitImportFormProps {
  builderImages?: NormalizedBuilderImages;
  projects?: {
    data: [];
    loaded: boolean;
  };
}
export interface DevfileImportFormProps {
  builderImages?: NormalizedBuilderImages;
  projects?: {
    data: [];
    loaded: boolean;
  };
}

export interface FirehoseList {
  data?: K8sResourceKind[];
  [key: string]: any;
}

export interface DeployImageFormData {
  formType?: string;
  project: ProjectData;
  application: ApplicationData;
  name: string;
  searchTerm: string;
  allowInsecureRegistry: boolean;
  registry: string;
  imageStream: {
    image: string;
    tag: string;
    namespace: string;
  };
  isi: ImageStreamImageData;
  image: ImageStreamImageData;
  runtimeIcon?: string;
  isSearchingForImage: boolean;
  resources: Resources;
  resourceTypesNotValid?: Resources[];
  serverless?: ServerlessData;
  pipeline?: PipelineData;
  labels: { [name: string]: string };
  annotations?: { [name: string]: string };
  env?: { [name: string]: string };
  route: RouteData;
  build: BuildData;
  deployment: DeploymentData;
  limits: LimitsData;
  healthChecks: HealthChecksFormData;
  fileUpload?: FileUploadData;
}

export type FileUploadData = {
  name: string;
  value: File | '';
  javaArgs?: string;
};

export interface BaseFormData {
  formType?: string;
  name: string;
  project: ProjectData;
  application: ApplicationData;
  serverless?: ServerlessData;
  image: ImageData;
  runtimeIcon?: string;
  route: RouteData;
  resources: Resources;
  resourceTypesNotValid?: Resources[];
  build: BuildData;
  deployment: DeploymentData;
  labels: { [name: string]: string };
  limits: LimitsData;
  healthChecks: HealthChecksFormData;
}
export interface UploadJarFormData extends BaseFormData {
  fileUpload: FileUploadData;
}

export interface GitImportFormData extends BaseFormData {
  pipeline?: PipelineData;
  resourceTypesNotValid?: Resources[];
  git: GitData;
  docker: DockerData;
  devfile?: DevfileData;
}

export interface ApplicationData {
  initial?: string;
  name: string;
  selectedKey: string;
  isInContext?: boolean;
}

export interface ImageData {
  selected: string;
  recommended: string;
  isRecommending: boolean;
  couldNotRecommend: boolean;
  tag: string;
  tagObj: object;
  ports: ContainerPort[];
}

export interface ImageStreamImageData {
  name: string;
  image: { [key: string]: any };
  tag: string;
  status: { metadata: {}; status: string };
  ports: ContainerPort[];
}

export interface ProjectData {
  name: string;
  displayName?: string;
  description?: string;
}

export interface GitData {
  url: string;
  type: string;
  ref: string;
  dir: string;
  showGitType: boolean;
  secret: string;
  isUrlValidating: boolean;
}

export interface DockerData {
  dockerfilePath?: string;
}

type DevfileData = {
  devfilePath?: string;
  devfileContent?: string;
  devfileSourceUrl?: string;
  devfileHasError: boolean;
  devfileSuggestedResources?: DevfileSuggestedResources;
};

export type DevfileSuggestedResources = {
  imageStream: K8sResourceKind;
  buildResource: K8sResourceKind;
  deployResource: K8sResourceKind;
  service: K8sResourceKind;
  route: K8sResourceKind;
};

export interface RouteData {
  disable?: boolean;
  create: boolean;
  targetPort: string;
  unknownTargetPort?: string;
  defaultUnknownPort?: number;
  path?: string;
  hostname?: string;
  secure?: boolean;
  tls?: TLSData;
}

export interface TLSData {
  termination: string;
  insecureEdgeTerminationPolicy: string;
  certificate: string;
  privateKey: string;
  caCertificate: string;
  destinationCACertificate: string;
}

export interface BuildData {
  triggers: {
    webhook?: boolean;
    image?: boolean;
    config?: boolean;
  };
  env: (NameValuePair | NameValueFromPair)[];
  strategy: string;
  source?: { type: string };
}

export interface DeploymentData {
  triggers: {
    image: boolean;
    config?: boolean;
  };
  replicas: number;
  env: (NameValuePair | NameValueFromPair)[];
}

export interface ServerlessData {
  scaling: ServerlessScaling;
}

export interface ServerlessScaling {
  minpods: number | '';
  maxpods: number | '';
  concurrencytarget: number | '';
  concurrencylimit: number | '';
  autoscale: AutoscaleWindowType;
  concurrencyutilization: number | '';
}

export enum GitTypes {
  github = 'github',
  gitlab = 'gitlab',
  bitbucket = 'bitbucket',
  unsure = 'other',
  invalid = '',
}

export const GitReadableTypes = {
  [GitTypes.github]: 'GitHub',
  [GitTypes.gitlab]: 'GitLab',
  [GitTypes.bitbucket]: 'Bitbucket',
  [GitTypes.unsure]: 'Other',
};

export enum ImportTypes {
  git = 'git',
  devfile = 'devfile',
  docker = 'docker',
  s2i = 's2i',
}

export enum Resources {
  OpenShift = 'openshift',
  Kubernetes = 'kubernetes',
  KnativeService = 'knative',
}

export const ReadableResourcesNames = {
  [Resources.OpenShift]: DeploymentConfigModel.label,
  [Resources.Kubernetes]: DeploymentModel.label,
  [Resources.KnativeService]: `Knative ${ServiceModel.label}`,
};

export interface ImportData {
  type: ImportTypes;
  title: string;
  buildStrategy: string;
  loader: LazyLoader<GitImportFormProps | SourceToImageFormProps>;
}

export enum TerminationTypes {
  edge = 'Edge',
  passthrough = 'Passthrough',
  reencrypt = 'Re-encrypt',
}

export enum InsecureTrafficTypes {
  None = 'None',
  Allow = 'Allow',
  Redirect = 'Redirect',
}

export enum PassthroughInsecureTrafficTypes {
  None = 'None',
  Redirect = 'Redirect',
}

export interface AutoscaleWindowType {
  autoscalewindow: number | '';
  autoscalewindowUnit: string;
  defaultAutoscalewindowUnit: string;
}

export enum CPUUnits {
  m = 'millicores',
  '' = 'cores',
}

export enum MemoryUnits {
  Mi = 'Mi',
  Gi = 'Gi',
}

export enum ImportOptions {
  GIT = 'GIT',
  CONTAINER = 'CONTAINER',
  CATALOG = 'CATALOG',
  DOCKERFILE = 'DOCKERFILE',
  DEVFILE = 'DEVFILE',
  DATABASE = 'DATABASE',
  EVENTSOURCE = 'EVENTSOURCE',
  EVENTPUBSUB = 'EVENTPUBSUB',
  OPERATORBACKED = 'OPERATORBACKED',
  HELMCHARTS = 'HELMCHARTS',
  SAMPLES = 'SAMPLES',
  EVENTCHANNEL = 'EVENTCHANNEL',
  UPLOADJAR = 'UPLOADJAR',
}

export interface HealthChecksFormData {
  readinessProbe: HealthCheckFormProbe;
  livenessProbe: HealthCheckFormProbe;
  startupProbe?: HealthCheckFormProbe;
}
