import { BaseService } from '../services/base-service';
import { RepoStatus } from '../types';
import { ImportStrategy } from '../types/git';
import { detectBuildTypes } from './build-tool-type-detector';
import { detectPacFiles, isPacRepository } from './pac-strategy-detector';

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
  {
    name: 'Pipeline as Code',
    type: ImportStrategy.PAC,
    expectedRegexp: /^\.?tekton$/,
    priority: 3,
    customDetection: detectPacFiles,
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
  isRepositoryEnabled: boolean = false,
): Promise<DetectedServiceData> => {
  let detectedStrategies: DetectedStrategy[] = [];
  let loaded: boolean = false;
  let loadError = null;

  const repositoryStatus = gitService
    ? await gitService.isRepoReachable()
    : RepoStatus.GitTypeNotDetected;
  let detectedFiles: string[] = [];
  let detectedCustomData: string[];
  let pacFiles: string[] = [];
  let addPacRepositoryStrategy: boolean;

  if (repositoryStatus === RepoStatus.Reachable) {
    try {
      const { files } = await gitService.getRepoFileList({ includeFolder: true });
      pacFiles = await detectPacFiles(gitService);
      addPacRepositoryStrategy = await isPacRepository(isRepositoryEnabled, gitService, pacFiles);

      detectedStrategies = await Promise.all(
        ImportStrategyList.map<Promise<DetectedStrategy>>(async (strategy) => {
          detectedFiles = files.filter((f) => strategy.expectedRegexp.test(f));
          if (detectedFiles.length > 0 && strategy.customDetection) {
            detectedCustomData = await strategy.customDetection(gitService);
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

  if (!addPacRepositoryStrategy) {
    detectedStrategies = detectedStrategies.filter(
      (strategy) => strategy.type !== ImportStrategy.PAC,
    );
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
