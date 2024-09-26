import { ValidatedOptions } from '@patternfly/react-core';
import { WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import { GitProvider } from '@console/git-service/src';
import { DetectedStrategy } from '@console/git-service/src/utils/import-strategy-detector';
import { DeploymentModel, DeploymentConfigModel } from '@console/internal/models';
import { K8sResourceKind, ContainerPort } from '@console/internal/module/k8s';
import { PipelineData } from '@console/pipelines-plugin/src/components/import/import-types';
import { RepositoryFormValues } from '@console/pipelines-plugin/src/components/repository/types';
import { LazyLoader } from '@console/plugin-sdk';
import { NameValuePair, NameValueFromPair, LimitsData } from '@console/shared';
import { ClusterBuildStrategy } from '@console/shipwright-plugin/src/types';
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
  pac?: PacData;
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
  import?: ImportStrategyData;
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
  import?: ImportStrategyData;
}

export interface GitImportFormData extends BaseFormData {
  pipeline?: PipelineData;
  resourceTypesNotValid?: Resources[];
  git: GitData;
  docker: DockerData;
  devfile?: DevfileData;
  pac?: PacData;
  import?: ImportStrategyData;
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
  imageEnv?: { [key: string]: string };
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
  detectedType?: GitProvider;
  type: GitProvider;
  ref: string;
  dir: string;
  showGitType: boolean;
  secret: string;
  isUrlValidating: boolean;
  validated?: ValidatedOptions;
  secretResource?: K8sResourceKind;
}

export interface DockerData {
  dockerfilePath?: string;
  dockerfileHasError?: boolean;
}

export type DevfileData = {
  devfilePath?: string;
  devfileContent?: string;
  devfileSourceUrl?: string;
  devfileHasError: boolean;
  devfileSuggestedResources?: DevfileSuggestedResources;
  devfileProjectType?: string;
};

export type PacData = {
  pacHasError: boolean;
  repository: RepositoryFormValues;
};

export type DevfileSuggestedResources = {
  imageStream: K8sResourceKind;
  buildResource: K8sResourceKind;
  deployResource: K8sResourceKind;
  service?: K8sResourceKind | null;
  route?: K8sResourceKind | null;
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
  labels?: { [name: string]: string };
}

export interface TLSData {
  termination: TerminationType;
  insecureEdgeTerminationPolicy: InsecureTrafficType | PassthroughInsecureTrafficType;
  certificate: string;
  key: string;
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
  option?: BuildOptions;
  clusterBuildStrategy?: ClusterBuildStrategy;
}

export interface DetectedStrategyFormData extends DetectedStrategy {
  title?: string;
  iconUrl?: string;
}

export interface ImportStrategyData {
  loaded?: boolean;
  knativeFuncLoaded?: boolean;
  loadError?: string;
  strategies?: DetectedStrategy[];
  recommendedStrategy?: DetectedStrategyFormData;
  selectedStrategy?: DetectedStrategyFormData;
  showEditImportStrategy?: boolean;
  strategyChanged?: boolean;
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
  domainMapping?: string[];
}

export interface ServerlessScaling {
  minpods: number | '';
  maxpods: number | '';
  concurrencytarget: number | '';
  concurrencylimit: number | '';
  defaultConcurrencytarget?: number | '';
  defaultConcurrencyutilization?: number | '';
  autoscale: AutoscaleWindowType;
  concurrencyutilization: number | '';
}

export const GitReadableTypes = {
  [GitProvider.GITHUB]: 'GitHub',
  [GitProvider.GITLAB]: 'GitLab',
  [GitProvider.GITEA]: 'Gitea',
  [GitProvider.BITBUCKET]: 'Bitbucket',
  [GitProvider.UNSURE]: 'Other',
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

export enum BuildOptions {
  BUILDS = 'BUILDS',
  SHIPWRIGHT_BUILD = 'SHIPWRIGHT_BUILD',
  PIPELINES = 'PIPELINES',
  DISABLED = 'DISABLED',
}

export enum SampleRuntime {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'Node.js' = 'nodejs',
  Quarkus = 'quarkus',
  dotnet = 'dotnet',
  Python = 'python',
  Go = 'golang',
  springboot = 'spring-boot',
}

export const ReadableResourcesNames: Record<Resources, string> = {
  [Resources.OpenShift]: DeploymentConfigModel.labelKey,
  [Resources.Kubernetes]: DeploymentModel.labelKey,
  // t('devconsole~Serverless Deployment')
  [Resources.KnativeService]: `devconsole~Serverless Deployment`,
};

export const ReadableBuildOptions: Record<BuildOptions, string> = {
  [BuildOptions.BUILDS]: 'devconsole~BuildConfig',
  // t('devconsole~Builds for OpenShift (Shipwright)')
  [BuildOptions.SHIPWRIGHT_BUILD]: 'devconsole~Builds for OpenShift (Shipwright)',
  // t('devconsole~Build using pipelines')
  [BuildOptions.PIPELINES]: 'devconsole~Build using pipelines',
  [BuildOptions.DISABLED]: 'devconsole~Disabled',
};

export const ResourcesKinds: Record<Resources, string> = {
  [Resources.OpenShift]: DeploymentConfigModel.kind,
  [Resources.Kubernetes]: DeploymentModel.kind,
  [Resources.KnativeService]: 'Service',
};

export interface ImportData {
  type: ImportTypes;
  title: string;
  buildStrategy: string;
  loader: LazyLoader<GitImportFormProps | SourceToImageFormProps>;
}

export enum TerminationType {
  EDGE = 'edge',
  PASSTHROUGH = 'passthrough',
  REENCRYPT = 'reencrypt',
}

export enum InsecureTrafficType {
  None = 'None',
  Allow = 'Allow',
  Redirect = 'Redirect',
}

export enum PassthroughInsecureTrafficType {
  None = 'None',
  Redirect = 'Redirect',
}

export interface AutoscaleWindowType {
  autoscalewindow: number | '';
  defaultAutoscalewindow?: number | '';
  autoscalewindowUnit: string;
  defaultAutoscalewindowUnit: string;
}

export enum CPUUnits {
  m = 'millicores',
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
  EVENTBROKER = 'EVENTBROKER',
  UPLOADJAR = 'UPLOADJAR',
}

export interface HealthChecksFormData {
  readinessProbe: HealthCheckFormProbe;
  livenessProbe: HealthCheckFormProbe;
  startupProbe?: HealthCheckFormProbe;
}
