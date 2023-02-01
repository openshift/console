import { RepoStatus } from '../..';
import { ImportStrategy } from '../../types/git';
import { detectImportStrategies } from '../import-strategy-detector';
import * as serverlessFxUtils from '../serverless-strategy-detector';

describe('Import strategy detection', () => {
  let mockIsServerlessFxRepository;

  beforeEach(() => {
    mockIsServerlessFxRepository = jest.spyOn(serverlessFxUtils, 'isServerlessFxRepository');
  });
  afterEach(() => {
    mockIsServerlessFxRepository.mockReset();
  });

  it('should detect dockerfile strategy', async () => {
    const files = ['src', 'Dockerfile', 'Dockerfile.build'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
      isRepoReachable: jest.fn(() => Promise.resolve(RepoStatus.Reachable)),
    };
    mockIsServerlessFxRepository.mockReturnValue(Promise.resolve(false));
    const data = await detectImportStrategies(
      'https://github.com/divyanshiGupta/bus.git',
      mockGitService,
    );
    const types = data.strategies;
    expect(types[0].type).toEqual(ImportStrategy.DOCKERFILE);
    expect(types[0].detectedFiles).toEqual(['Dockerfile', 'Dockerfile.build']);
  });

  it('should detect devfile strategy', async () => {
    const files = ['src', 'devfile.yaml'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
      isRepoReachable: jest.fn(() => Promise.resolve(RepoStatus.Reachable)),
    };
    mockIsServerlessFxRepository.mockReturnValue(Promise.resolve(false));
    const data = await detectImportStrategies(
      'https://github.com/redhat-developer/devfile-sample',
      mockGitService,
    );
    const types = data.strategies;
    expect(types[0].type).toEqual(ImportStrategy.DEVFILE);
    expect(types[0].detectedFiles).toEqual(['devfile.yaml']);
  });

  it('should detect serverlessFx strategy', async () => {
    const files = ['func.yaml', 'app.js', 'package.json'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
      isRepoReachable: jest.fn(() => Promise.resolve(RepoStatus.Reachable)),
      isFuncYamlPresent: jest.fn(() => Promise.resolve(true)),
    };
    mockIsServerlessFxRepository.mockReturnValue(Promise.resolve(true));
    const data = await detectImportStrategies(
      'https://github.com/Lucifergene/oc-func',
      mockGitService,
      true,
    );
    const types = data.strategies;
    expect(types[0].type).toEqual(ImportStrategy.SERVERLESS_FUNCTION);
  });

  it('should detect all import strategies with correct order', async () => {
    const files = ['src', 'pom.xml', 'devfile.yaml', 'Dockerfile.build'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
      isRepoReachable: jest.fn(() => Promise.resolve(RepoStatus.Reachable)),
    };
    mockIsServerlessFxRepository.mockReturnValue(Promise.resolve(false));
    const data = await detectImportStrategies(
      'https://github.com/redhat-developer/devfile-sample',
      mockGitService,
    );
    const types = data.strategies;
    expect(types.length).toEqual(3);
    expect(types[0].type).toEqual(ImportStrategy.DEVFILE);
    expect(types[1].type).toEqual(ImportStrategy.DOCKERFILE);
    expect(types[2].type).toEqual(ImportStrategy.S2I);
  });
});
