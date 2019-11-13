import { BuildTool, BuildTools, BuildType, WebAppDependencies } from '../types';

export function detectBuildTypes(files: string[]): BuildType[] {
  const buildTypes = BuildTools.map((t: BuildTool) => {
    const matchedFiles = files.filter((f: string) => t.expectedRegexps.test(f));
    return { buildType: t.type, language: t.language, files: matchedFiles };
  });
  return buildTypes
    .filter((b: BuildType) => b.files.length > 0)
    .sort((a, b) => b.files.length - a.files.length);
}

export function isModernWebApp(packageJsonContent: string): boolean {
  const packageJson = JSON.parse(packageJsonContent);
  let isWebApp = false;
  WebAppDependencies.forEach((dep) => {
    if (dep in packageJson.dependencies) {
      isWebApp = true;
    }
  });

  return isWebApp;
}
