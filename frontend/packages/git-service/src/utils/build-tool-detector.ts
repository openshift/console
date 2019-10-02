import { BuildTool, BuildTools, BuildType } from '../types';

export function detectBuildType(files: string[]): BuildType[] {
  const buildTypes = BuildTools.map((t: BuildTool) => {
    const matchedFiles = files.filter((f: string) => t.expectedRegexps.test(f));
    return { buildType: t.type, language: t.language, files: matchedFiles };
  });
  return buildTypes
    .filter((b: BuildType) => b.files.length > 0)
    .sort((a, b) => b.files.length - a.files.length);
}
