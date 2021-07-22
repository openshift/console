import { detectBuildTypes, isModernWebApp } from '../build-tool-detector';
import { packageJson1, packageJson2 } from './mock-data';

describe('Build tool detection tests', () => {
  it('should return nodejs build type', function() {
    const files = ['package.json', 'public', 'src'];
    const buildTypes = detectBuildTypes(files);
    expect(buildTypes[0].buildType).toEqual('nodejs');
    expect(buildTypes[0].language).toEqual('javascript');
  });

  it('should return true for package.json of web app', () => {
    expect(isModernWebApp(packageJson1)).toBeTruthy();
  });

  it('should return false for package.json of nodejs app', () => {
    expect(isModernWebApp(packageJson2)).toBeFalsy();
  });

  it('should return false for invalid package.json', () => {
    expect(isModernWebApp('{')).toBeFalsy();
  });
});
