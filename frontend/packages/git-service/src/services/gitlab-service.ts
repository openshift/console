import { Gitlab } from 'gitlab';
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

export class GitlabService extends BaseService {
  private readonly client: any;

  private readonly metadata: RepoMetadata;

  constructor(gitsource: GitSource) {
    super(gitsource);
    this.metadata = this.getRepoMetadata();
    const token = this.getAuthProvider();
    this.client = new Gitlab({
      host: this.metadata.host,
      token,
    });
  }

  getRepoMetadata(): RepoMetadata {
    const { name, owner, protocol, source, full_name: fullName } = GitUrlParse(this.gitsource.url);
    const host = `${protocol}://${source}`;
    return {
      repoName: name,
      owner,
      host,
      defaultBranch: this.gitsource.ref || 'master',
      fullName,
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
      const resp = await this.client.Projects.search(this.metadata.repoName);
      for (const re of resp) {
        if (re.path_with_namespace === this.metadata.fullName) {
          return re.id;
        }
      }
      throw new Error('Unable to find gitlab project id, check project details!');
    } catch (e) {
      throw e;
    }
  };

  isRepoReachable = async (): Promise<boolean> => {
    try {
      const resp = await this.client.Projects.search(this.metadata.repoName);
      if (resp.length < 1) {
        return false;
      }
      for (const re of resp) {
        if (re.path_with_namespace === this.metadata.fullName) {
          return true;
        }
      }

      return false;
    } catch (e) {
      throw e;
    }
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
      const resp = await this.client.Repositories.tree(projectID);
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

  isDockerfilePresent = async (): Promise<boolean> => {
    try {
      const projectID = await this.getProjectId();
      await this.client.RepositoryFiles.showRaw(
        projectID,
        'Dockerfile',
        this.metadata.defaultBranch,
      );
      return true;
    } catch (e) {
      return false;
    }
  };

  getDockerfileContent = async (): Promise<string | null> => {
    try {
      const projectID = await this.getProjectId();
      return await this.client.RepositoryFiles.showRaw(
        projectID,
        'Dockerfile',
        this.metadata.defaultBranch,
      );
    } catch (e) {
      return null;
    }
  };

  getPackageJsonContent = async (): Promise<string | null> => {
    try {
      const projectID = await this.getProjectId();
      return await this.client.RepositoryFiles.showRaw(
        projectID,
        'package.json',
        this.metadata.defaultBranch,
      );
    } catch (e) {
      return null;
    }
  };
}
