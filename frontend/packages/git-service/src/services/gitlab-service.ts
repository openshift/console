import * as GitUrlParse from 'git-url-parse';
import { Gitlab } from 'gitlab';
import i18n from 'i18next';
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

type GitlabRepo = {
  id: number;
  path_with_namespace: string;
};

const removeLeadingSlash = (str: string) => str?.replace(/^\//, '') || '';

export class GitlabService extends BaseService {
  private readonly client: any;

  private readonly metadata: RepoMetadata;

  private repo: GitlabRepo;

  constructor(gitsource: GitSource) {
    super(gitsource);
    this.metadata = this.getRepoMetadata();
    const token = this.getAuthProvider();
    this.client = new Gitlab({
      host: this.metadata.host,
      token,
    });
    this.repo = null;
  }

  private getRepo = async (): Promise<GitlabRepo> => {
    if (this.repo) {
      return Promise.resolve(this.repo);
    }
    const repo: GitlabRepo = await this.client.Projects.show(this.metadata.fullName);
    if (!repo) {
      throw new Error(i18n.t('git-service~Unable to find repository'));
    } else if (repo.path_with_namespace !== this.metadata.fullName) {
      throw new Error(
        i18n.t('git-service~Repository path {{path}} does not match expected name {{name}}', {
          path: repo.path_with_namespace,
          name: this.metadata.fullName,
        }),
      );
    }

    this.repo = repo;
    return Promise.resolve(this.repo);
  };

  getRepoMetadata(): RepoMetadata {
    const { name, owner, protocol, resource, full_name: fullName } = GitUrlParse(
      this.gitsource.url,
    );
    const contextDir = removeLeadingSlash(this.gitsource.contextDir);
    const host = `${protocol}://${resource}`;
    return {
      repoName: name,
      owner,
      host,
      defaultBranch: this.gitsource.ref,
      fullName,
      contextDir,
    };
  }

  getAuthProvider = (): any => {
    switch (this.gitsource.secretType) {
      case SecretType.PERSONAL_ACCESS_TOKEN || SecretType.OAUTH:
        return this.gitsource.secretContent;
      default:
        return null;
    }
  };

  getProjectId = async (): Promise<any> => {
    try {
      const repo = await this.getRepo();
      return repo.id;
    } catch (e) {
      throw e;
    }
  };

  isRepoReachable = async (): Promise<RepoStatus> => {
    try {
      await this.getRepo();
      return RepoStatus.Reachable;
    } catch (e) {
      if (e.response.status === 429) {
        return RepoStatus.RateLimitExceeded;
      }
    }
    return RepoStatus.Unreachable;
  };

  getRepoBranchList = async (): Promise<BranchList> => {
    try {
      const projectID = await this.getProjectId();
      const resp = await this.client.Branches.all(projectID);
      const list = resp.map((b) => b.name);
      return { branches: list };
    } catch (e) {
      return { branches: [] };
    }
  };

  getRepoFileList = async (): Promise<RepoFileList> => {
    try {
      const projectID = await this.getProjectId();
      const resp = await this.client.Repositories.tree(projectID, {
        path: this.metadata.contextDir,
      });
      const files = resp.reduce((acc, file) => {
        if (file.type === 'blob') acc.push(file.path);
        return acc;
      }, []);
      return { files };
    } catch (e) {
      return { files: [] };
    }
  };

  getRepoLanguageList = async (): Promise<RepoLanguageList> => {
    try {
      const projectID = await this.getProjectId();
      const resp = await this.client.Projects.languages(projectID);
      return { languages: Object.keys(resp) };
    } catch (e) {
      return { languages: [] };
    }
  };

  isFilePresent = async (path: string): Promise<boolean> => {
    try {
      const projectID = await this.getProjectId();
      await this.client.RepositoryFiles.showRaw(projectID, path, this.metadata.defaultBranch);
      return true;
    } catch (e) {
      return false;
    }
  };

  getFileContent = async (path: string): Promise<string | null> => {
    try {
      const projectID = await this.getProjectId();
      return await this.client.RepositoryFiles.showRaw(
        projectID,
        path,
        this.metadata.defaultBranch,
      );
    } catch (e) {
      return null;
    }
  };

  filePath = (file: string): string => {
    return this.metadata.contextDir ? `${this.metadata.contextDir}/${file}` : file;
  };

  isDockerfilePresent = () => this.isFilePresent(this.filePath('Dockerfile'));

  getDockerfileContent = () => this.getFileContent(this.filePath('Dockerfile'));

  isDevfilePresent = () => this.isFilePresent(this.filePath('devfile.yaml'));

  getDevfileContent = () => this.getFileContent(this.filePath('devfile.yaml'));

  getPackageJsonContent = () => this.getFileContent(this.filePath('package.json'));
}
