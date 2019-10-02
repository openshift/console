import { detectBuildType } from '../utils';
import {
  BranchList,
  BuildType,
  GitSource,
  RepoFileList,
  RepoLanguageList,
  RepoMetadata,
} from '../types';

export abstract class BaseService {
  protected gitsource: GitSource;

  constructor(gitsource: GitSource) {
    this.gitsource = gitsource;
  }

  protected abstract getRepoMetadata(): RepoMetadata;

  protected abstract getAuthProvider(): any;

  // Returns if repo reachable or not along with the api response.
  abstract async isRepoReachable(): Promise<boolean>;

  // Returns list of branches for given gitsource.
  abstract async getRepoBranchList(): Promise<BranchList>;

  // Returns source code tree for given gitsource
  abstract async getRepoFileList(): Promise<RepoFileList>;

  // Returns list of detected languages
  abstract async getRepoLanguageList(): Promise<RepoLanguageList>;

  // Check if Dockerfile present in the repo.
  abstract async isDockerfilePresent(): Promise<boolean>;

  // Checks if dockerfile exist in the repo and returns dockerfile content
  abstract async getDockerfileContent(): Promise<string>;

  // Detect build types for given gitsource, It runs regular expressions on file list
  // and returns list of build types matched.
  async detectBuildType(): Promise<BuildType[]> {
    try {
      const fileList = await this.getRepoFileList();
      return detectBuildType(fileList.files);
    } catch (e) {
      return [];
    }
  }
}
