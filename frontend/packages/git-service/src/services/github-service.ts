import * as Octokit from '@octokit/rest';
import * as GitUrlParse from 'git-url-parse';
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

export class GithubService extends BaseService {
  private readonly client: Octokit;

  private readonly metadata: RepoMetadata;

  constructor(gitsource: GitSource) {
    super(gitsource);
    const opts = this.getAuthProvider();
    this.metadata = this.getRepoMetadata();
    this.client = new Octokit(opts);
  }

  protected getAuthProvider = (): Octokit.Options => {
    switch (this.gitsource.secretType) {
      case SecretType.PERSONAL_ACCESS_TOKEN:
      case SecretType.BASIC_AUTH:
        return { auth: this.gitsource.secretContent.password };
      default:
        return null;
    }
  };

  protected getRepoMetadata = (): RepoMetadata => {
    const { name, owner, source } = GitUrlParse(this.gitsource.url);
    const contextDir = this.gitsource.contextDir?.replace(/\/$/, '') || '';
    return {
      repoName: name,
      owner,
      host: source,
      defaultBranch: this.gitsource.ref,
      contextDir,
    };
  };

  isRepoReachable = async (): Promise<RepoStatus> => {
    try {
      const resp = await this.client.repos.get({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
      });

      if (resp.status === 200) {
        return RepoStatus.Reachable;
      }
    } catch (e) {
      if (e.status === 403) {
        return RepoStatus.RateLimitExceeded;
      }
    }
    return RepoStatus.Unreachable;
  };

  getRepoBranchList = async (): Promise<BranchList> => {
    try {
      const resp = await this.client.repos.listBranches({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
      });
      const list = resp.data.map((r) => {
        return r.name;
      });
      return { branches: list };
    } catch (e) {
      return { branches: [] };
    }
  };

  getRepoFileList = async (): Promise<RepoFileList> => {
    try {
      const resp = await this.client.repos.getContents({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
        path: this.metadata.contextDir,
        ...(this.metadata.defaultBranch ? { ref: this.metadata.defaultBranch } : {}),
      });
      let files = [];
      if (resp.status === 200 && Array.isArray(resp.data)) {
        files = resp.data.map((t) => t.name);
      }
      return { files };
    } catch (e) {
      return { files: [] };
    }
  };

  getRepoLanguageList = async (): Promise<RepoLanguageList> => {
    try {
      const resp = await this.client.repos.listLanguages({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
      });
      if (resp.status === 200) {
        return { languages: Object.keys(resp.data) };
      }
      return { languages: [] };
    } catch (e) {
      return { languages: [] };
    }
  };

  isFilePresent = async (path: string): Promise<boolean> => {
    try {
      const resp = await this.client.repos.getContents({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
        path,
        ...(this.metadata.defaultBranch ? { ref: this.metadata.defaultBranch } : {}),
      });
      return resp.status === 200;
    } catch (e) {
      return false;
    }
  };

  getFileContent = async (path: string): Promise<string | null> => {
    try {
      const resp = await this.client.repos.getContents({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
        path,
        ...(this.metadata.defaultBranch ? { ref: this.metadata.defaultBranch } : {}),
      });
      if (resp.status === 200) {
        // eslint-disable-next-line dot-notation
        return Buffer.from(resp.data['content'], 'base64').toString();
      }
      return null;
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
