import { K8sResourceKind, ContainerPort } from '@console/internal/module/k8s';
import { LazyLoader } from '@console/plugin-sdk/src/typings/types';
import { NameValuePair, NameValueFromPair } from '../formik-fields/field-types';
import { NormalizedBuilderImages } from '../../utils/imagestream-utils';

export interface DeployImageFormProps {
  builderImages?: NormalizedBuilderImages;
  projects?: {
    data: [];
    loaded: boolean;
  };
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

export interface FirehoseList {
  data?: K8sResourceKind[];
  [key: string]: any;
}

export interface DeployImageFormData {
  project: ProjectData;
  application: ApplicationData;
  name: string;
  searchTerm: string;
  isi: ImageStreamImageData;
  image: ImageStreamImageData;
  isSearchingForImage: boolean;
  serverless?: ServerlessData;
  labels: { [name: string]: string };
  env: { [name: string]: string };
  route: RouteData;
  serverlessRoute?: ServerlessRouteData;
  build: BuildData;
  deployment: DeploymentData;
  limits: LimitsData;
}

export interface GitImportFormData {
  name: string;
  project: ProjectData;
  application: ApplicationData;
  git: GitData;
  docker: DockerData;
  serverless?: ServerlessData;
  image: ImageData;
  route: RouteData;
  serverlessRoute?: ServerlessRouteData;
  build: BuildData;
  deployment: DeploymentData;
  labels: { [name: string]: string };
  limits: LimitsData;
}

export interface ApplicationData {
  initial: string;
  name: string;
  selectedKey: string;
}

export interface ImageData {
  selected: string;
  recommended: string;
  tag: string;
  tagObj: object;
  ports: ContainerPort[];
}

export interface ImageStreamImageData {
  name: string;
  image: object;
  tag: string;
  status: string;
  ports: ContainerPort[];
}

export interface ProjectData {
  name: string;
  displayName: string;
  description: string;
}

export interface GitData {
  url: string;
  type: string;
  ref: string;
  dir: string;
  showGitType: boolean;
  secret: string;
}

export interface DockerData {
  dockerfilePath?: string;
  containerPort?: number;
}

export interface RouteData {
  create: boolean;
  targetPort: string;
  path: string;
  hostname: string;
  secure: boolean;
  tls: TLSData;
}

export interface ServerlessRouteData {
  targetPort: string;
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
    webhook: boolean;
    image: boolean;
    config: boolean;
  };
  env: (NameValuePair | NameValueFromPair)[];
  strategy: string;
}

export interface DeploymentData {
  triggers: {
    image: boolean;
    config: boolean;
  };
  replicas: number;
  env: (NameValuePair | NameValueFromPair)[];
}

export interface ServerlessData {
  enabled: boolean;
  scaling: ServerlessScaling;
}

export interface ServerlessScaling {
  minpods: number;
  maxpods: number | '';
  concurrencytarget: number | '';
  concurrencylimit: number | '';
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
  docker = 'docker',
  s2i = 's2i',
}

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

export interface LimitsData {
  cpu: ResourceType;
  memory: ResourceType;
}

export interface ResourceType {
  request: number | string;
  requestUnit: string;
  limit: number | string;
  limitUnit: string;
}

export enum CPUUnits {
  m = 'millicores',
  '' = 'cores',
}

export enum MemoryUnits {
  Mi = 'Mi',
  Gi = 'Gi',
}
