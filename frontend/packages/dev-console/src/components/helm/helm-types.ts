export interface HelmRelease {
  name: string;
  namespace: string;
  chart: {
    files: object[];
    metadata: {
      name: string;
      version: string;
    };
    templates: object[];
    values: object;
  };
  info: {
    description: string;
    deleted: string;
    first_deployed: string;
    last_deployed: string;
    status: string;
  };
  hooks: object[];
  manifest: string;
  version: string;
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
