import { detectBuildTypes } from '../build-tool-type-detector';

describe('Build tool type detection', () => {
  it('should detect only nodejs build type', async () => {
    const files = ['package.json', 'public', 'src'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
    };
    const types = await detectBuildTypes(mockGitService);
    expect(types.length).toEqual(1);
    expect(types[0].type).toEqual('nodejs');
  });

  it('should detect modern web-app & nodejs build types', async () => {
    const files = ['package.json', 'public', 'src'];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(() =>
        Promise.resolve('{ "dependencies": { "react": "0.0.1" } }'),
      ),
    };
    const types = await detectBuildTypes(mockGitService);
    expect(types.length).toEqual(2);
    expect(types[0].type).toEqual('modern-webapp');
    expect(types[1].type).toEqual('nodejs');
  });

  it('should not detect any build type', async () => {
    const files = [];
    const mockGitService: any = {
      getRepoFileList: jest.fn(() => Promise.resolve({ files })),
      getPackageJsonContent: jest.fn(),
    };
    const types = await detectBuildTypes(mockGitService);
    expect(types.length).toEqual(0);
  });
});
