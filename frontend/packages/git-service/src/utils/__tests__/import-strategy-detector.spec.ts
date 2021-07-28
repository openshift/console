import { ImportStrategy } from '../../types/git';
import { detectImportStrategies } from '../import-strategy-detector';

describe('Import strategy detection', () => {
  it('should detect dockerfile strategy', async () => {
    const files = ['src', 'Dockerfile', 'Dockerfile.build'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
    };
    const types = await detectImportStrategies(mockGitService);
    expect(types[0].type).toEqual(ImportStrategy.DOCKERFILE);
    expect(types[0].detectedFiles).toEqual(['Dockerfile', 'Dockerfile.build']);
  });

  it('should detect devfile strategy', async () => {
    const files = ['src', 'devfile.yaml'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
    };
    const types = await detectImportStrategies(mockGitService);
    expect(types[0].type).toEqual(ImportStrategy.DEVFILE);
    expect(types[0].detectedFiles).toEqual(['devfile.yaml']);
  });

  it('should detect all import strategies with correct order', async () => {
    const files = ['src', 'pom.xml', 'devfile.yaml', 'Dockerfile.build'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
    };
    const types = await detectImportStrategies(mockGitService);
    expect(types.length).toEqual(3);
    expect(types[0].type).toEqual(ImportStrategy.DEVFILE);
    expect(types[1].type).toEqual(ImportStrategy.DOCKERFILE);
    expect(types[2].type).toEqual(ImportStrategy.S2I);
  });
});
