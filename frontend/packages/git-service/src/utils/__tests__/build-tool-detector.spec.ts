import { detectBuildType } from '../build-tool-detector';

describe('Build tool detection tests', () => {
  it('should return nodejs build type', function() {
    const files = ['package.json', 'public', 'src'];
    const buildTypes = detectBuildType(files);
    expect(buildTypes[0].buildType).toEqual('nodejs');
    expect(buildTypes[0].language).toEqual('javascript');
  });
});
