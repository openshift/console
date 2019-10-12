export interface RepoMetadata {
  repoName: string;
  owner: string;
  host: string;
  defaultBranch: string;
  fullName?: string;
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
