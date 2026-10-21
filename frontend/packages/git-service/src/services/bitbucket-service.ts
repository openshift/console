import * as GitUrlParse from 'git-url-parse';
import { Base64 } from 'js-base64';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { DevConsoleEndpointResponse } from '@console/shared/src';
import type { GitSource, RepoMetadata, BranchList, RepoLanguageList, RepoFileList } from '../types';
import { SecretType, RepoStatus } from '../types';
import { BaseService } from './base-service';

type BBWebhookBody = {
  url: string;
  events: string[];
  skip_cert_verification: boolean;
  active: boolean;
};

type BitbucketWebhookRequest = {
  headers: Headers;
  isServer: boolean;
  baseURL: string;
  owner: string;
  repoName: string;
  body: BBWebhookBody;
};

export const BITBUCKET_WEBHOOK_BACKEND_URL = '/api/dev-console/webhooks/bitbucket';

export class BitbucketService extends BaseService {
  private readonly metadata: RepoMetadata;

  private baseURL = 'https://api.bitbucket.org/2.0';

  private isServer = false;

  constructor(gitsource: GitSource) {
    super(gitsource);
    this.metadata = this.getRepoMetadata();
    if (!this.metadata.host.includes('bitbucket.org')) {
      this.baseURL = `${this.metadata.host}/rest/api/1.0`;
      this.isServer = true;
    }
  }

  protected getAuthProvider = (): any => {
    switch (this.gitsource.secretType) {
      case SecretType.BASIC_AUTH: {
        const { username, password } = this.gitsource.secretContent;
        const encodedAuth = Base64.encode(`${Base64.decode(username)}:${Base64.decode(password)}`);
        return { Authorization: `Basic ${encodedAuth}` };
      }
      default:
        return null;
    }
  };

  protected fetchJson = async (
    url: string,
    requestMethod?: string,
    headers?: object,
    body?: object,
  ) => {
    const authHeaders = this.getAuthProvider();

    const requestHeaders = {
      Accept: 'application/json',
      ...authHeaders,
      ...headers,
    };

    const response = await fetch(url, {
      method: requestMethod || 'GET',
      headers: requestHeaders,
      ...(body && { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      throw response;
    }
    if (response.headers.get('Content-Type') === 'text/plain') {
      return response.text();
    }
    return response.json();
  };

  getRepoMetadata = (): RepoMetadata => {
    const { name, owner, resource, protocols, port } = GitUrlParse(this.gitsource.url);
    const contextDir = this.gitsource.contextDir?.replace(/\/$/, '') || '';
    const rawProtocol = protocols?.[0];
    const isHttpProtocol = rawProtocol === 'http' || rawProtocol === 'https';
    const protocol = isHttpProtocol ? rawProtocol : 'https';

    const host = port ? `${protocol}://${resource}:${port}` : `${protocol}://${resource}`;

    return {
      repoName: name,
      owner,
      host,
      defaultBranch: this.gitsource.ref || 'HEAD',
      contextDir,
      devfilePath: this.gitsource.devfilePath,
      dockerfilePath: this.gitsource.dockerfilePath,
    };
  };

  isRepoReachable = async (): Promise<RepoStatus> => {
    const url = this.isServer
      ? `${this.baseURL}/projects/${this.metadata.owner}/repos/${this.metadata.repoName}`
      : `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}`;
    try {
      const data = await this.fetchJson(url);
      if (data.slug === this.metadata.repoName) {
        return RepoStatus.Reachable;
      }
    } catch (e) {
      switch (e.status) {
        case 429: {
          return RepoStatus.RateLimitExceeded;
        }
        case 403: {
          return RepoStatus.PrivateRepo;
        }
        case 404: {
          return RepoStatus.ResourceNotFound;
        }
        default: {
          return RepoStatus.InvalidGitTypeSelected;
        }
      }
    }
    return RepoStatus.Unreachable;
  };

  getRepoBranchList = async (): Promise<BranchList> => {
    const url = this.isServer
      ? `${this.baseURL}/projects/${this.metadata.owner}/repos/${this.metadata.repoName}/branches`
      : `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/refs/branches`;
    try {
      const data = await this.fetchJson(url);
      const list = data.values.map((b) => b.name);
      return { branches: list };
    } catch (e) {
      return { branches: [] };
    }
  };

  isServerURL = (isServer: boolean, specificPath?: string) => {
    let url = '';
    if (specificPath) {
      url = isServer
        ? `${this.baseURL}/projects/${this.metadata.owner}/repos/${this.metadata.repoName}/files/${this.metadata.contextDir}/${specificPath}?limit=50&at=${this.metadata.defaultBranch}`
        : `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/${this.metadata.contextDir}/${specificPath}?pagelen=50`;
    } else {
      url = isServer
        ? `${this.baseURL}/projects/${this.metadata.owner}/repos/${this.metadata.repoName}/files/${this.metadata.contextDir}?limit=50&at=${this.metadata.defaultBranch}`
        : `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/${this.metadata.contextDir}?pagelen=50`;
    }
    return url;
  };

  getRepoFileList = async (params?: { specificPath?: string }): Promise<RepoFileList> => {
    const url = params?.specificPath
      ? this.isServerURL(this.isServer, params.specificPath)
      : this.isServerURL(this.isServer);
    try {
      const data = await this.fetchJson(url);
      const files = this.isServer ? data.values : data.values?.map((f) => f.path) || [];
      return { files };
    } catch (e) {
      return { files: [] };
    }
  };

  getRepoLanguageList = async (): Promise<RepoLanguageList> => {
    const url = this.isServer
      ? `${this.baseURL}/projects/${this.metadata.owner}/repos/${this.metadata.repoName}`
      : `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}`;
    try {
      const data = await this.fetchJson(url);
      return { languages: [data.language] };
    } catch (e) {
      return { languages: [] };
    }
  };

  createRepoWebhook = async (
    token: string,
    webhookURL: string,
    sslVerification: boolean,
  ): Promise<boolean> => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: `Basic ${token}`,
    });
    const body: BBWebhookBody = {
      url: webhookURL,
      events: ['repo:push', 'pullrequest:created', 'pullrequest:updated'],
      skip_cert_verification: !sslVerification,
      active: true,
    };

    const webhookRequestBody: BitbucketWebhookRequest = {
      headers,
      isServer: this.isServer,
      baseURL: this.baseURL,
      owner: this.metadata.owner,
      repoName: this.metadata.repoName,
      body,
    };

    const webhookResponse: DevConsoleEndpointResponse = await consoleFetchJSON.post(
      BITBUCKET_WEBHOOK_BACKEND_URL,
      webhookRequestBody,
    );
    if (!webhookResponse.statusCode) {
      throw new Error('Unexpected proxy response: Status code is missing!');
    }
    return webhookResponse.statusCode === 201;
  };

  isFilePresent = async (path: string): Promise<boolean> => {
    const filePath = path.replace(/^\//, '');
    const url = this.isServer
      ? `${this.baseURL}/projects/${this.metadata.owner}/repos/${this.metadata.repoName}/raw/${filePath}?at=${this.metadata.defaultBranch}`
      : `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/${filePath}`;
    try {
      await this.fetchJson(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  getFileContent = async (path: string): Promise<string | null> => {
    const filePath = path.replace(/^\//, '');
    const url = this.isServer
      ? `${this.baseURL}/projects/${this.metadata.owner}/repos/${this.metadata.repoName}/raw/${filePath}?at=${this.metadata.defaultBranch}`
      : `${this.baseURL}/repositories/${this.metadata.owner}/${this.metadata.repoName}/src/${this.metadata.defaultBranch}/${filePath}`;
    try {
      const data = await this.fetchJson(url);
      return data as string;
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
