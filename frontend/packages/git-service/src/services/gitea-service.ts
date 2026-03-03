import * as GitUrlParse from 'git-url-parse';
import { Base64 } from 'js-base64';
import * as _ from 'lodash';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/lib-core';
import {
  BranchList,
  GitSource,
  RepoFileList,
  RepoLanguageList,
  RepoMetadata,
  RepoStatus,
  SecretType,
} from '../types';
import { definitions } from '../types/generated/gitea';
import { BaseService } from './base-service';

export class GiteaService extends BaseService {
  private readonly metadata: RepoMetadata;

  constructor(gitsource: GitSource) {
    super(gitsource);
    this.metadata = this.getRepoMetadata();
  }

  protected getAuthProvider = (): any => {
    if (this.gitsource.secretType === SecretType.BASIC_AUTH) {
      const { username, password } = this.gitsource.secretContent;
      if (!_.isEmpty(username)) {
        const encodedAuth = Base64.encode(`${Base64.decode(username)}:${Base64.decode(password)}`);
        return { authorization: `Basic ${encodedAuth}` };
      }
      return { Authorization: `token ${Base64.decode(password)}` };
    }
    return null;
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
    const { name, owner, resource, protocols, port, full_name: fullName } = GitUrlParse(
      this.gitsource.url,
    );
    const contextDir = this.gitsource.contextDir?.replace(/\/$/, '') || '';
    const rawProtocol = protocols?.[0];
    const isHttpProtocol = rawProtocol === 'http' || rawProtocol === 'https';
    const protocol = isHttpProtocol ? rawProtocol : 'https';

    const host = port ? `${protocol}://${resource}:${port}` : `${protocol}://${resource}`;

    return {
      repoName: name,
      owner,
      host,
      defaultBranch: this.gitsource.ref,
      fullName,
      contextDir,
      devfilePath: this.gitsource.devfilePath,
      dockerfilePath: this.gitsource.dockerfilePath,
    };
  };

  isRepoReachable = async (): Promise<RepoStatus> => {
    const url = `${this.metadata.host}/api/v1/repos/${this.metadata.owner}/${this.metadata.repoName}`;
    try {
      const data: definitions['Repository'] = await this.fetchJson(url);
      if (data?.name === this.metadata.repoName) {
        return RepoStatus.Reachable;
      }
    } catch (e) {
      return RepoStatus.GiteaRepoUnreachable;
    }
    return RepoStatus.GiteaRepoUnreachable;
  };

  getRepoBranchList = async (): Promise<BranchList> => {
    const url = `${this.metadata.host}/api/v1/repos/${this.metadata.owner}/${this.metadata.repoName}/branches`;
    try {
      const data: definitions['Branch'][] = await this.fetchJson(url);
      const list = data?.map((b) => b.name) || [];
      return { branches: list };
    } catch (e) {
      return { branches: [] };
    }
  };

  getRepoFileList = async (params?: { specificPath?: string }): Promise<RepoFileList> => {
    const url = params?.specificPath
      ? `${this.metadata.host}/api/v1/repos/${this.metadata.owner}/${this.metadata.repoName}/contents/${this.metadata.contextDir}/${params.specificPath}`
      : `${this.metadata.host}/api/v1/repos/${this.metadata.owner}/${this.metadata.repoName}/contents/${this.metadata.contextDir}`;

    try {
      const data: definitions['ContentsResponse'][] = await this.fetchJson(url);
      const list = data?.map((f) => f.name) || [];
      return { files: list };
    } catch (e) {
      return { files: [] };
    }
  };

  getRepoLanguageList = async (): Promise<RepoLanguageList> => {
    const url = `${this.metadata.host}/api/v1/repos/${this.metadata.owner}/${this.metadata.repoName}/languages`;
    try {
      const data: { [key: string]: number } = await this.fetchJson(url);
      const list = Object?.keys(data) || [];
      return { languages: list };
    } catch (e) {
      return { languages: [] };
    }
  };

  /* TODO: Gitea PAC Support */
  createRepoWebhook = async (token: string, webhookURL: string): Promise<boolean> => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: `token ${token}`,
    });
    const body = {
      active: true,
      authorization_header: '',
      branch_filter: '*',
      config: {
        content_type: 'json',
        url: webhookURL,
      },
      events: ['push', 'pull_request'],
      type: 'gitea',
    };
    const url = `${this.metadata.host}/api/v1/repos/${this.metadata.owner}/${this.metadata.repoName}/hooks`;

    const webhookResponse: Response = await consoleFetchJSON.post(url, body, { headers });

    return webhookResponse.status === 201;
  };

  isFilePresent = async (path: string): Promise<boolean> => {
    const filePath = path.replace(/^\//, '');
    const url = `${this.metadata.host}/api/v1/repos/${this.metadata.owner}/${this.metadata.repoName}/contents/${filePath}?ref=${this.metadata.defaultBranch}`;
    try {
      await this.fetchJson(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  getFileContent = async (path: string): Promise<string | null> => {
    const filePath = path.replace(/^\//, '');
    const url = `${this.metadata.host}/api/v1/repos/${this.metadata.owner}/${this.metadata.repoName}/raw/${filePath}?ref=${this.metadata.defaultBranch}`;
    try {
      const data = await this.fetchJson(url);
      return data as string;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Error fetching file content', e);
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
