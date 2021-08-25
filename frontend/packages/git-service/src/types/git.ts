export enum SecretType {
  NO_AUTH,
  BASIC_AUTH,
  SSH,
  PERSONAL_ACCESS_TOKEN,
  OAUTH,
}

export interface GitSource {
  url: string;
  secretType?: SecretType;
  secretContent?: any;
  ref?: string;
  contextDir?: string;
  devfilePath?: string;
  dockerfilePath?: string;
}

export enum GitProvider {
  GITHUB = 'github',
  BITBUCKET = 'bitbucket',
  GITLAB = 'gitlab',
  UNSURE = 'other',
  INVALID = '',
}

export enum ImportStrategy {
  S2I,
  DOCKERFILE,
  DEVFILE,
}
