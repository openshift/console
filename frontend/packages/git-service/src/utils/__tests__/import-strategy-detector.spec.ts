import { RepoStatus } from '../..';
import { ImportStrategy } from '../../types/git';
import { detectImportStrategies } from '../import-strategy-detector';
import * as pacDetectorUtils from '../pac-strategy-detector';

describe('Import strategy detection', () => {
  let mockDetectPacFiles;
  let mockIsPipelineFilePresent;

  beforeEach(() => {
    mockDetectPacFiles = jest.spyOn(pacDetectorUtils, 'detectPacFiles');
    mockIsPipelineFilePresent = jest.spyOn(pacDetectorUtils, 'isPipelineFilePresent');
  });
  afterEach(() => {
    mockDetectPacFiles.mockReset();
    mockIsPipelineFilePresent.mockReset();
  });

  it('should detect dockerfile strategy', async () => {
    const files = ['src', 'Dockerfile', 'Dockerfile.build'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
      isRepoReachable: jest.fn(() => Promise.resolve(RepoStatus.Reachable)),
    };
    mockDetectPacFiles.mockReturnValue(Promise.resolve([]));
    mockIsPipelineFilePresent.mockReturnValue(false);
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
    mockDetectPacFiles.mockReturnValue(Promise.resolve([]));
    mockIsPipelineFilePresent.mockReturnValue(false);
    const data = await detectImportStrategies(
      'https://github.com/redhat-developer/devfile-sample',
      mockGitService,
    );
    const types = data.strategies;
    expect(types[0].type).toEqual(ImportStrategy.DEVFILE);
    expect(types[0].detectedFiles).toEqual(['devfile.yaml']);
  });

  it('should detect pac strategy', async () => {
    const files = ['.tekton', 'app.js', 'package.json'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
      isRepoReachable: jest.fn(() => Promise.resolve(RepoStatus.Reachable)),
      isTektonFolderPresent: jest.fn(() => Promise.resolve(true)),
    };
    mockDetectPacFiles.mockReturnValue(Promise.resolve(['.tekton', 'push.yaml']));
    mockIsPipelineFilePresent.mockReturnValue(true);
    const data = await detectImportStrategies(
      'https://github.com/Lucifergene/oc-pipe',
      mockGitService,
      true,
    );
    const types = data.strategies;
    expect(types[0].type).toEqual(ImportStrategy.PAC);
  });

  it('should detect all import strategies with correct order', async () => {
    const files = ['src', 'pom.xml', 'devfile.yaml', 'Dockerfile.build'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
      isRepoReachable: jest.fn(() => Promise.resolve(RepoStatus.Reachable)),
    };
    mockDetectPacFiles.mockReturnValue(Promise.resolve([]));
    mockIsPipelineFilePresent.mockReturnValue(false);
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
