import { BaseService } from '../services/base-service';
import { DeployStrategy } from '../types/git';

type DeployStrategyType = {
  name: string;
  type: DeployStrategy;
  expectedRegexp: RegExp;
};

const DeployStrategyList: DeployStrategyType[] = [
  {
    name: 'Dockerfile',
    type: DeployStrategy.DOCKERFILE,
    expectedRegexp: /^Dockerfile.*/,
  },
  {
    name: 'Devfile',
    type: DeployStrategy.DEVFILE,
    expectedRegexp: /^devfile.yaml$/,
  },
  {
    name: 'S2i',
    type: DeployStrategy.S2I,
    expectedRegexp: /^/,
  },
];

const isValidStrategy = (fileList: string[]) => (deployStrategy: DeployStrategyType) => {
  return fileList.some((f) => deployStrategy.expectedRegexp.test(f));
};

export const detectDeployStrategies = async (
  gitService: BaseService,
): Promise<DeployStrategy[]> => {
  const { files } = await gitService.getRepoFileList();
  const validStrategies = DeployStrategyList.filter(isValidStrategy(files));
  return validStrategies.map((strategy) => strategy.type);
};
