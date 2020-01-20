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
  metadata: {
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
  };
  templates: object[];
  values: object;
  lock?: object;
  schema?: string;
}

export enum HelmReleaseStatus {
  Deployed = 'deployed',
  Failed = 'failed',
  Other = 'other',
}

export enum HelmFilterType {
  Row = 'row',
  Text = 'text',
}
