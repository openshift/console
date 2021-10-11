export interface RepoMetadata {
  repoName: string;
  owner: string;
  host: string;
  defaultBranch?: string;
  fullName?: string;
  contextDir?: string;
  devfilePath?: string;
  dockerfilePath?: string;
}

export interface BranchList {
  branches: string[];
}

export interface RepoLanguageList {
  languages: string[];
}

export interface RepoFileList {
  files: string[];
}

export enum RepoStatus {
  Reachable,
  Unreachable,
  RateLimitExceeded,
}
