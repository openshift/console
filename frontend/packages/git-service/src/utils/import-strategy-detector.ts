import { BaseService } from '../services/base-service';
import { RepoStatus } from '../types';
import { ImportStrategy } from '../types/git';
import { detectBuildTypes } from './build-tool-type-detector';

type ImportStrategyType = {
  name: string;
  type: ImportStrategy;
  expectedRegexp: RegExp;
  priority: number;
  customDetection?: (gitService: BaseService) => Promise<any>;
};

const ImportStrategyList: ImportStrategyType[] = [
  {
    name: 'Devfile',
    type: ImportStrategy.DEVFILE,
    expectedRegexp: /^\.?devfile\.yaml$/,
    priority: 2,
  },
  {
    name: 'Dockerfile',
    type: ImportStrategy.DOCKERFILE,
    expectedRegexp: /^Dockerfile.*/,
    priority: 1,
  },
  {
    name: 'Builder Image',
    type: ImportStrategy.S2I,
    expectedRegexp: /^/,
    priority: 0,
    customDetection: detectBuildTypes,
  },
];

export type DetectedStrategy = {
  name: string;
  type: ImportStrategy;
  priority: number;
  detectedFiles: string[];
  detectedCustomData?: any;
};

type DetectedServiceData = {
  loaded: boolean;
  loadError?: any;
  repositoryStatus: RepoStatus;
  strategies: DetectedStrategy[];
};

export const detectImportStrategies = async (
  repository: string,
  gitService: BaseService,
): Promise<DetectedServiceData> => {
  let detectedStrategies: DetectedStrategy[] = [];
  let loaded: boolean = false;
  let loadError = null;

  const repositoryStatus = gitService ? await gitService.isRepoReachable() : RepoStatus.Unreachable;
  let detectedFiles: string[] = [];
  let detectedCustomData;

  if (repositoryStatus === RepoStatus.Reachable) {
    try {
      const { files } = await gitService.getRepoFileList();
      detectedStrategies = await Promise.all(
        ImportStrategyList.map<Promise<DetectedStrategy>>(async (strategy) => {
          if (strategy.customDetection) {
            detectedCustomData = await strategy.customDetection(gitService);
          } else {
            detectedFiles = files.filter((f) => strategy.expectedRegexp.test(f));
          }
          return {
            name: strategy.name,
            type: strategy.type,
            priority: strategy.priority,
            detectedFiles,
            detectedCustomData,
          };
        }),
      );
      loaded = true;
    } catch (err) {
      loaded = true;
      loadError = err.message;
    }
  } else {
    loaded = true;
  }

  detectedStrategies = detectedStrategies
    .filter((strategy) => !!strategy.detectedFiles.length || !!strategy.detectedCustomData?.length)
    .sort((t1, t2) => t2.priority - t1.priority);

  return {
    loaded,
    loadError,
    repositoryStatus,
    strategies: detectedStrategies,
  };
};
