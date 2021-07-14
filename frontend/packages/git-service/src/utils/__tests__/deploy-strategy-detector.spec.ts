import { DeployStrategy } from '../../types/git';
import { detectDeployStrategies } from '../deploy-strategy-detector';

describe('Deploy strategy detection', () => {
  it('should detect dockerfile and s2i strategies', async () => {
    const files = ['src', 'Dockerfile'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
    };
    const types = await detectDeployStrategies(mockGitService);
    expect(types.length).toEqual(2);
    expect(types[0]).toEqual(DeployStrategy.DOCKERFILE);
    expect(types[1]).toEqual(DeployStrategy.S2I);
  });

  it('should detect devfile and s2i strategies', async () => {
    const files = ['src', 'devfile.yaml'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
    };
    const types = await detectDeployStrategies(mockGitService);
    expect(types.length).toEqual(2);
    expect(types[0]).toEqual(DeployStrategy.DEVFILE);
    expect(types[1]).toEqual(DeployStrategy.S2I);
  });

  it('should detect all 3 deploy strategies', async () => {
    const files = ['src', 'app', 'devfile.yaml', 'Dockerfile.build'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
    };
    const types = await detectDeployStrategies(mockGitService);
    expect(types.length).toEqual(3);
    expect(types[0]).toEqual(DeployStrategy.DOCKERFILE);
    expect(types[1]).toEqual(DeployStrategy.DEVFILE);
    expect(types[2]).toEqual(DeployStrategy.S2I);
  });
});
