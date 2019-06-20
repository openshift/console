import { K8sResourceKind, ContainerPort } from '@console/internal/module/k8s';
import { NameValuePair, NameValueFromPair } from '../formik-fields/field-types';

export interface FirehoseList {
  data?: K8sResourceKind[];
  [key: string]: any;
}

export interface GitImportFormData {
  name: string;
  project: ProjectData;
  application: ApplicationData;
  git: GitData;
  image: ImageData;
  route: RouteData;
  build: BuildData;
  deployment: DeploymentData;
  labels: { [name: string]: string };
}

export interface ApplicationData {
  name: string;
  selectedKey: string;
}

export interface ImageData {
  selected: string;
  recommended: string;
  tag: string;
  ports: ContainerPort[];
}

export interface ProjectData {
  name: string;
}

export interface GitData {
  url: string;
  type: string;
  ref: string;
  dir: string;
  showGitType: boolean;
}

export interface RouteData {
  create: boolean;
  targetPort: string;
  path: string;
  hostname: string;
  secure: boolean;
  tls: TLSData;
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
}

export interface DeploymentData {
  triggers: {
    image: boolean;
    config: boolean;
  };
  replicas: number;
  env: (NameValuePair | NameValueFromPair)[];
}

export enum GitTypes {
  '' = 'Please choose Git type',
  github = 'GitHub',
  gitlab = 'GitLab',
  bitbucket = 'Bitbucket',
}

export enum TerminationTypes {
  edge = 'Edge',
  passthrough = 'Passthrough',
  reencrypt = 'Re-encrypt',
}

export enum InsecureTrafficTypes {
  none = 'None',
  allow = 'Allow',
  redirect = 'Redirect',
}

export enum PassthroughInsecureTrafficTypes {
  none = 'None',
  redirect = 'Redirect',
}
