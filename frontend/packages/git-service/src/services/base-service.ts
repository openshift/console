import { detectBuildTypes, isModernWebApp } from '../utils';
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

  /**
   * Fetch metadata of the repository.
   */
  protected abstract getRepoMetadata(): RepoMetadata;

  /**
   * Get the auth providor for the git service.
   */
  protected abstract getAuthProvider(): any;

  /**
   * Returns if repo reachable or not along with the api response.
   */
  abstract async isRepoReachable(): Promise<boolean>;

  /**
   * Returns list of branches for given gitsource.
   */
  abstract async getRepoBranchList(): Promise<BranchList>;

  /**
   * Returns source code tree for given gitsource
   */
  abstract async getRepoFileList(): Promise<RepoFileList>;

  /**
   * Returns list of detected languages.
   */
  abstract async getRepoLanguageList(): Promise<RepoLanguageList>;

  /**
   * Check if Dockerfile present in the repo.
   */
  abstract async isDockerfilePresent(): Promise<boolean>;

  /**
   * Checks if dockerfile exist in the repo and returns dockerfile content
   */
  abstract async getDockerfileContent(): Promise<string>;

  /**
   * Check if Devfile present in the repo.
   */
  abstract async isDevfilePresent(): Promise<boolean>;

  /**
   * Checks if package.json exist in the repo and returns content of the file.
   */
  abstract async getPackageJsonContent(): Promise<string>;

  /**
   * Detect build types for given gitsource, It runs regular expressions on file list
   * and returns list of build types matched.
   */
  async detectBuildTypes(): Promise<BuildType[]> {
    try {
      const fileList = await this.getRepoFileList();
      const buildTypes = detectBuildTypes(fileList.files);
      if (fileList.files.includes('package.json')) {
        const packageJsonContent = await this.getPackageJsonContent();
        if (isModernWebApp(packageJsonContent)) {
          return buildTypes.sort((a, b) => {
            if (b.buildType === 'modern-webapp') return 1;
            if (a.buildType === 'modern-webapp') return -1;
            return 0;
          });
        }
      }
      return buildTypes;
    } catch (e) {
      return [];
    }
  }
}
