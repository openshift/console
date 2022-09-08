import { K8sResourceKind } from '@console/internal/module/k8s';

export interface HelmRelease {
  name: string;
  namespace: string;
  chart: HelmChart;
  info: {
    description: string;
    deleted: string;
    first_deployed: string;
    last_deployed: string;
    status: string;
    notes: string;
  };
  version: number | string;
  hooks?: object[];
  manifest?: string;
}

export interface HelmChart {
  files: { name: string; data: string }[];
  metadata: HelmChartMetaData;
  templates: object[];
  values: object;
  lock?: object;
  schema?: string;
}

export interface HelmChartMetaData {
  name: string;
  version: string;
  created?: string;
  description?: string;
  digest?: string;
  apiVersion: string;
  appVersion?: string;
  annotations?: {
    [key: string]: string;
  };
  keywords?: string[];
  home?: string;
  icon?: string;
  sources?: string[];
  maintainers?: { name: string; email?: string; url?: string }[];
  dependencies?: object[];
  type?: string;
  urls: string[];
  kubeVersion?: string;
  repoName?: string;
}

export type HelmChartEntries = {
  [name: string]: HelmChartMetaData[];
};

export interface HelmReleaseResourcesData {
  releaseName: string;
  releaseVersion: number | string;
  chartIcon: string;
  manifestResources: K8sResourceKind[];
  releaseNotes: string;
}

export interface HelmReleaseResourcesMap {
  [name: string]: HelmReleaseResourcesData;
}

export enum HelmReleaseStatus {
  Deployed = 'deployed',
  Failed = 'failed',
  Other = 'other',
}

export enum HelmActionType {
  Install = 'Install',
  Upgrade = 'Upgrade',
  Rollback = 'Rollback',
}

export interface HelmActionConfigType {
  type: HelmActionType;
  title: string;
  subTitle: string | { form: string; yaml: string };
  helmReleaseApi: string;
  fetch: (url: string, json: any, options?: {}, timeout?: number) => Promise<any>;
  redirectURL: string;
}

export enum HelmActionOrigins {
  details = 'details',
  list = 'list',
  topology = 'topology',
}

export interface HelmChartRepositoryType {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: { [key: string]: string };
    annotations?: { [key: string]: string };
  };
  spec: {
    connectionConfig: {
      url: string;
      ca?: { name: string };
      tlsClientConfig?: { name: string };
    };
    description?: string;
    disabled?: boolean;
    name?: string;
  };
}

export interface HelmChartRepositoryFormData {
  repoName: string;
  repoUrl: string;
  repoDisplayName?: string;
  scope: string;
  repoDescription?: string;
  ca?: string;
  tlsClientConfig?: string;
  disabled?: boolean;
  metadata?: object;
}

export interface HelmChartRepositoryData {
  editorType: string;
  yamlData: string;
  formData: HelmChartRepositoryFormData;
  formReloadCount?: number;
}
