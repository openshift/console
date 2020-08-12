import * as Octokit from '@octokit/rest';
import * as GitUrlParse from 'git-url-parse';
import {
  GitSource,
  SecretType,
  RepoMetadata,
  BranchList,
  RepoLanguageList,
  RepoFileList,
} from '../types';
import { BaseService } from './base-service';

export class GithubService extends BaseService {
  private readonly client: Octokit;

  private readonly metadata: RepoMetadata;

  constructor(gitsource: GitSource) {
    super(gitsource);
    const opts = this.getAuthProvider();
    this.metadata = this.getRepoMetadata();
    this.client = new Octokit({ auth: opts });
  }

  protected getAuthProvider = (): any => {
    switch (this.gitsource.secretType) {
      case SecretType.BASIC_AUTH: {
        const { username, password } = this.gitsource.secretContent;
        return { username, password };
      }
      case SecretType.NO_AUTH:
        return null;
      default:
        return null;
    }
  };

  protected getRepoMetadata = (): RepoMetadata => {
    const { name, owner, source } = GitUrlParse(this.gitsource.url);
    return { repoName: name, owner, host: source, defaultBranch: this.gitsource.ref || 'master' };
  };

  isRepoReachable = async (): Promise<boolean> => {
    try {
      const resp = await this.client.repos.get({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
      });
      return resp.status === 200;
    } catch (e) {
      return false;
    }
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
      const resp = await this.client.git.getTree({
        // eslint-disable-next-line @typescript-eslint/camelcase
        tree_sha: this.metadata.defaultBranch,
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
      });
      let files = [];
      if (resp.status === 200) {
        files = resp.data.tree.map((t) => t.path);
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

  isDockerfilePresent = async (): Promise<boolean> => {
    try {
      const resp = await this.client.repos.getContents({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
        path: 'Dockerfile',
      });
      return resp.status === 200;
    } catch (e) {
      return false;
    }
  };

  getDockerfileContent = async (): Promise<string | null> => {
    try {
      const resp = await this.client.repos.getContents({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
        path: 'Dockerfile',
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

  isDevfilePresent = async (): Promise<boolean> => {
    try {
      const resp = await this.client.repos.getContents({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
        path: 'devfile.yaml',
      });
      return resp.status === 200;
    } catch (e) {
      return false;
    }
  };

  getPackageJsonContent = async (): Promise<string | null> => {
    try {
      const resp = await this.client.repos.getContents({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
        path: 'package.json',
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
}
