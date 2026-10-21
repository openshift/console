export interface RepoMetadata {
  repoName: string;
  owner: string;
  /**
   * The host URL including protocol and port.
   *
   * Format: `<protocol>://<hostname>[:<port>]`
   *
   * Examples:
   * - `https://github.com`
   * - `http://gitlab.example.com:8080`
   * - `https://bitbucket.example.com:7990`
   *
   * **Breaking Change:** Previously, this field contained only the hostname
   * (e.g., `github.com`). Now it includes the full protocol and port to properly
   * support enterprise Git instances with custom protocols and ports.
   *
   * If you need just the hostname, parse it from this field:
   * ```typescript
   * const hostname = new URL(metadata.host).hostname;
   * ```
   */
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
  GitTypeNotDetected,
  InvalidGitTypeSelected,
  PrivateRepo,
  ResourceNotFound,
  GiteaRepoUnreachable,
}
