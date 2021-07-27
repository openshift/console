import { BaseService } from '../services/base-service';
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
    expectedRegexp: /^devfile.yaml$/,
    priority: 2,
  },
  {
    name: 'Dockerfile',
    type: ImportStrategy.DOCKERFILE,
    expectedRegexp: /^Dockerfile.*/,
    priority: 1,
  },
  {
    name: 'S2i',
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

export const detectImportStrategies = async (
  gitService: BaseService,
): Promise<DetectedStrategy[]> => {
  const { files } = await gitService.getRepoFileList();
  let detectedFiles: string[] = [];
  let detectedCustomData;

  const detectedStrategies = await Promise.all(
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

  return detectedStrategies
    .filter((strategy) => !!strategy.detectedFiles.length)
    .sort((t1, t2) => t2.priority - t1.priority);
};
