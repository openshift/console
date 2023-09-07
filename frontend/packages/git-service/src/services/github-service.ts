import * as Octokit from '@octokit/rest';
import * as GitUrlParse from 'git-url-parse';
import { Base64 } from 'js-base64';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/lib-core';
import { API_PROXY_URL, ProxyResponse } from '@console/shared/src/utils/proxy';
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
    const authOpts = this.getAuthProvider();
    this.metadata = this.getRepoMetadata();
    const baseUrl =
      this.metadata.host === 'github.com' ? null : `https://${this.metadata.host}/api/v3`;
    this.client = new Octokit({ ...authOpts, baseUrl });
  }

  protected getAuthProvider = (): Octokit.Options => {
    switch (this.gitsource.secretType) {
      case SecretType.PERSONAL_ACCESS_TOKEN:
      case SecretType.BASIC_AUTH:
      case SecretType.OAUTH:
        return { auth: Base64.decode(this.gitsource.secretContent.password) };
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
      devfilePath: this.gitsource.devfilePath,
      dockerfilePath: this.gitsource.dockerfilePath,
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
      switch (e.status) {
        case 403: {
          return RepoStatus.RateLimitExceeded;
        }
        case 404: {
          return RepoStatus.PrivateRepo;
        }
        case 422: {
          return RepoStatus.InvalidGitTypeSelected;
        }
        default: {
          return RepoStatus.Unreachable;
        }
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

  getRepoFileList = async (params?: { specificPath?: string }): Promise<RepoFileList> => {
    try {
      const resp = await this.client.repos.getContents({
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
        ...(params && params?.specificPath
          ? { path: `${this.metadata.contextDir}/${params.specificPath}` }
          : { path: this.metadata.contextDir }),
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

  createRepoWebhook = async (
    token: string,
    webhookURL: string,
    sslVerification: boolean,
    webhookSecret: string,
  ): Promise<boolean> => {
    const headers = {
      Accept: ['application/vnd.github+json'],
      Authorization: [`Bearer ${token}`],
      'X-GitHub-Api-Version': ['2022-11-28'],
    };
    const body = {
      name: 'web',
      active: true,
      config: {
        url: webhookURL,
        content_type: 'json',
        insecure_ssl: sslVerification ? '0' : '1',
        secret: webhookSecret,
      },
      events: ['push', 'pull_request'],
    };
    const AddWebhookBaseURL =
      this.metadata.host === 'github.com'
        ? `https://api.github.com`
        : `https://${this.metadata.host}/api/v3`;
    /* Using DevConsole Proxy to create webhook as Octokit is giving CORS error */
    const webhookResponse: ProxyResponse = await consoleFetchJSON.post(API_PROXY_URL, {
      url: `${AddWebhookBaseURL}/repos/${this.metadata.owner}/${this.metadata.repoName}/hooks`,
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    return webhookResponse.statusCode === 201;
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

  isDockerfilePresent = () =>
    this.isFilePresent(`${this.metadata.contextDir}/${this.metadata.dockerfilePath}`);

  isTektonFolderPresent = () => this.isFilePresent(`${this.metadata.contextDir}/.tekton`);

  getDockerfileContent = () =>
    this.getFileContent(`${this.metadata.contextDir}/${this.metadata.dockerfilePath}`);

  isFuncYamlPresent = () =>
    this.isFilePresent(`${this.metadata.contextDir}/func.yaml`) ||
    this.isFilePresent(`${this.metadata.contextDir}/func.yml`);

  getFuncYamlContent = () =>
    this.getFileContent(`${this.metadata.contextDir}/func.yaml`) ||
    this.getFileContent(`${this.metadata.contextDir}/func.yml`);

  isDevfilePresent = () =>
    this.isFilePresent(`${this.metadata.contextDir}/${this.metadata.devfilePath}`);

  getDevfileContent = () =>
    this.getFileContent(`${this.metadata.contextDir}/${this.metadata.devfilePath}`);

  getPackageJsonContent = () => this.getFileContent(`${this.metadata.contextDir}/package.json`);
}
