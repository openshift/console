import * as ParseBitbucketUrl from 'parse-bitbucket-url';
import {
  GitSource,
  SecretType,
  RepoMetadata,
  BranchList,
  RepoLanguageList,
  RepoFileList,
} from '../types';
import { BaseService } from './base-service';
import { coFetchJSON } from '@console/internal/co-fetch';

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
    const { name, owner, host, branch } = ParseBitbucketUrl(this.gitsource.url);
    return { repoName: name, owner, host, defaultBranch: this.gitsource.ref || branch };
  };

  isRepoReachable = async (): Promise<boolean> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}`;
    try {
      const data = await coFetchJSON(url);
      return data.slug === this.metadata.repoName;
    } catch (e) {
      return false;
    }
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
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/?pagelen=50`;
    try {
      const data = await coFetchJSON(url);
      const files = data.values.map((f) => f.path);
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

  isDockerfilePresent = async (): Promise<boolean> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/Dockerfile`;
    try {
      await coFetchJSON(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  getDockerfileContent = async (): Promise<string | null> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/Dockerfile`;
    try {
      const data = await coFetchJSON(url);
      return data as string;
    } catch (e) {
      return null;
    }
  };

  isDevfilePresent = async (): Promise<boolean> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/devfile.yaml`;
    try {
      await coFetchJSON(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  getPackageJsonContent = async (): Promise<string | null> => {
    const url = `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/package.json`;
    try {
      const data = await coFetchJSON(url);
      return data as string;
    } catch (e) {
      return null;
    }
  };
}
