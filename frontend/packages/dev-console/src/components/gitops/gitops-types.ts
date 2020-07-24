export interface GitOpsAppGroupData {
  name: string;
  environments: string[];
  repo_url?: string;
}

export interface GitOpsManifestData {
  applications: GitOpsAppGroupData[];
}
