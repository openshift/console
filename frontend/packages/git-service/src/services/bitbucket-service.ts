import * as Bitbucket from 'bitbucket';
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

export class BitbucketService extends BaseService {
  private readonly client: Bitbucket;

  private readonly metadata: RepoMetadata;

  constructor(gitsource: GitSource) {
    super(gitsource);
    this.metadata = this.getRepoMetadata();
    this.client = new Bitbucket();
    const creds = this.getAuthProvider();
    if (creds) this.client.authenticate(creds);
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
    const { name, owner, source } = ParseBitbucketUrl(this.gitsource.url);
    return { repoName: name, owner, host: source, defaultBranch: this.gitsource.ref || 'master' };
  };

  isRepoReachable = async (): Promise<boolean> => {
    try {
      const { data } = await this.client.repositories.get({
        // eslint-disable-next-line @typescript-eslint/camelcase
        repo_slug: this.metadata.repoName,
        username: this.metadata.owner,
      });
      return data.name.toLocaleLowerCase() === this.metadata.repoName.toLocaleLowerCase();
    } catch (e) {
      return false;
    }
  };

  getRepoBranchList = async (): Promise<BranchList> => {
    try {
      const { data } = await this.client.refs.listBranches({
        // eslint-disable-next-line @typescript-eslint/camelcase
        repo_slug: this.metadata.repoName,
        username: this.metadata.owner,
      });
      const list = data.values.map((b) => b.name);
      return { branches: list };
    } catch (e) {
      return { branches: [] };
    }
  };

  getRepoFileList = async (): Promise<RepoFileList> => {
    try {
      const { data } = await this.client.repositories.readSrc({
        node: this.metadata.defaultBranch,
        path: '',
        username: this.metadata.owner,
        // eslint-disable-next-line @typescript-eslint/camelcase
        repo_slug: this.metadata.repoName,
        pagelen: 50,
      });
      const files = data.values.map((f) => f.path);
      return { files };
    } catch (e) {
      return { files: [] };
    }
  };

  getRepoLanguageList = async (): Promise<RepoLanguageList> => {
    try {
      const { data } = await this.client.repositories.get({
        // eslint-disable-next-line @typescript-eslint/camelcase
        repo_slug: this.metadata.repoName,
        username: this.metadata.owner,
      });
      return { languages: [data.language] };
    } catch (e) {
      return { languages: [] };
    }
  };

  isDockerfilePresent = async (): Promise<boolean> => {
    try {
      // this would throw an error if Dockerfile doesn't exist.
      await this.client.repositories.readSrc({
        username: this.metadata.owner,
        // eslint-disable-next-line @typescript-eslint/camelcase
        repo_slug: this.metadata.repoName,
        path: 'Dockerfile',
        node: this.metadata.defaultBranch,
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  getDockerfileContent = async (): Promise<string | null> => {
    try {
      const resp = await this.client.repositories.readSrc({
        username: this.metadata.owner,
        // eslint-disable-next-line @typescript-eslint/camelcase
        repo_slug: this.metadata.repoName,
        path: 'Dockerfile',
        node: this.metadata.defaultBranch,
      });
      return resp.data as string;
    } catch (e) {
      return null;
    }
  };

  getPackageJsonContent = async (): Promise<string | null> => {
    try {
      const resp = await this.client.repositories.readSrc({
        username: this.metadata.owner,
        // eslint-disable-next-line @typescript-eslint/camelcase
        repo_slug: this.metadata.repoName,
        path: 'package.json',
        node: this.metadata.defaultBranch,
      });
      return resp.data as string;
    } catch (e) {
      return null;
    }
  };
}
