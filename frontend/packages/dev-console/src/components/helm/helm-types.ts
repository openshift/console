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
  files: object[];
  metadata: HelmChartMetaData;
  templates: object[];
  values: object;
  lock?: object;
  schema?: string;
}

export interface HelmChartMetaData {
  name: string;
  version: string;
  description: string;
  apiVersion: string;
  appVersion: string;
  keywords?: string[];
  home?: string;
  icon?: string;
  sources?: string[];
  maintainers?: object[];
  dependencies?: object[];
  type?: string;
  urls: string[];
}

export interface HelmReleaseResourcesData {
  releaseName: string;
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
}

export interface HelmActionConfigType {
  title: string;
  subTitle: string;
  helmReleaseApi: string;
  fetch: (url: any, json: any, options?: {}) => Promise<any>;
  redirectURL: string;
}
