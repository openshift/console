import * as ParseBitbucketUrl from 'parse-bitbucket-url';
import { coFetchJSON } from '@console/internal/co-fetch';
import {
  GitSource,
  SecretType,
  RepoMetadata,
  BranchList,
  RepoLanguageList,
  RepoFileList,
  RepoStatus,
} from '../types';
import { BaseService } from './base-service';

export class BitbucketService extends BaseService {
  private readonly metadata: RepoMetadata;

  private readonly baseURL = 'https://api.bitbucket.org/2.0';

  constructor(gitsource: GitSource) {
    super(gitsource);
    this.metadata = this.getRepoMetadata();
  }

  protected getAuthProvider = (): any => {
    switch (this.gitsource.secretType) {
      case SecretType.BASIC_AUTH: {
        const { username, password } = this.gitsource.secretContent;
        return { type: 'basic', username, password };
      }
      case SecretType.NO_AUTH:
        return null;
      default:
        return null;
    }
  };

  getRepoMetadata = (): RepoMetadata => {
    const { name, owner, host } = ParseBitbucketUrl(this.gitsource.url);
    const contextDir = this.gitsource.contextDir?.replace(/\/$/, '') || '';
    return {
      repoName: name,
      owner,
      host,
      defaultBranch: this.gitsource.ref || 'HEAD',
      contextDir,
    };
  };

  isRepoReachable = async (): Promise<RepoStatus> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}`;
    try {
      const data = await coFetchJSON(url);
      if (data.slug === this.metadata.repoName) {
        return RepoStatus.Reachable;
      }
    } catch (e) {
      if (e.response.status === 429) {
        return RepoStatus.RateLimitExceeded;
      }
    }
    return RepoStatus.Unreachable;
  };

  getRepoBranchList = async (): Promise<BranchList> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/refs/branches`;
    try {
      const data = await coFetchJSON(url);
      const list = data.values.map((b) => b.name);
      return { branches: list };
    } catch (e) {
      return { branches: [] };
    }
  };

  getRepoFileList = async (): Promise<RepoFileList> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/${this.metadata.contextDir}?pagelen=50`;
    try {
      const data = await coFetchJSON(url);
      const files = data.values?.map((f) => f.path) || [];
      return { files };
    } catch (e) {
      return { files: [] };
    }
  };

  getRepoLanguageList = async (): Promise<RepoLanguageList> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}`;
    try {
      const data = await coFetchJSON(url);
      return { languages: [data.language] };
    } catch (e) {
      return { languages: [] };
    }
  };

  isFilePresent = async (path: string): Promise<boolean> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/${path}`;
    try {
      await coFetchJSON(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  getFileContent = async (path: string): Promise<string | null> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/${path}`;
    try {
      const data = await coFetchJSON(url);
      return data as string;
    } catch (e) {
      return null;
    }
  };

  isDockerfilePresent = () => this.isFilePresent(`${this.metadata.contextDir}/Dockerfile`);

  getDockerfileContent = () => this.getFileContent(`${this.metadata.contextDir}/Dockerfile`);

  isDevfilePresent = () => this.isFilePresent(`${this.metadata.contextDir}/devfile.yaml`);

  getDevfileContent = () => this.getFileContent(`${this.metadata.contextDir}/devfile.yaml`);

  getPackageJsonContent = () => this.getFileContent(`${this.metadata.contextDir}/package.json`);
}
