import {
  BranchList,
  BuildType,
  GitSource,
  RepoFileList,
  RepoLanguageList,
  RepoMetadata,
  RepoStatus,
} from '../types';
import { detectBuildTypes, isModernWebApp } from '../utils/build-tool-detector';

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
  abstract isRepoReachable(): Promise<RepoStatus>;

  /**
   * Returns list of branches for given gitsource.
   */
  abstract getRepoBranchList(): Promise<BranchList>;

  /**
   * Returns source code tree for given gitsource
   */
  abstract getRepoFileList(): Promise<RepoFileList>;

  /**
   * Returns list of detected languages.
   */
  abstract getRepoLanguageList(): Promise<RepoLanguageList>;

  /**
   * Check if Dockerfile present in the repo.
   */
  abstract isDockerfilePresent(): Promise<boolean>;

  /**
   * Checks if dockerfile exist in the repo and returns dockerfile content
   */
  abstract getDockerfileContent(): Promise<string>;

  /**
   * Check if Devfile present in the repo.
   */
  abstract isDevfilePresent(): Promise<boolean>;

  /**
   * Check if Devfile present in the repo.
   */
  abstract getDevfileContent(): Promise<string>;

  /**
   * Checks if package.json exist in the repo and returns content of the file.
   */
  abstract getPackageJsonContent(): Promise<string>;

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
