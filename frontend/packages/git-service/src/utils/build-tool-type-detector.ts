import { BaseService } from '../services/base-service';
import { BuildType } from '../types';
import { isModernWebApp } from './build-tool-detector';

type BuildTool = {
  name: string;
  type: string;
  language: string;
  expectedRegexp: RegExp;
  priority: number;
  customDetection?: (gitService: BaseService) => Promise<boolean>;
};

const BuildTools: BuildTool[] = [
  {
    name: 'Maven',
    type: 'java',
    language: 'java',
    expectedRegexp: /pom.xml/,
    priority: 0,
  },
  {
    name: 'Gradle',
    type: 'java',
    language: 'java',
    expectedRegexp: /.*gradle.*/,
    priority: 0,
  },
  {
    name: 'Golang',
    type: 'golang',
    language: 'go',
    expectedRegexp: RegExp([`.*.\\.go`, `Gopkg.toml`, `glide.yaml`].join('|')),
    priority: 0,
  },
  {
    name: 'Ruby',
    type: 'ruby',
    language: 'ruby',
    expectedRegexp: RegExp([`Gemfile`, `Rakefile`, `config.ru`].join('|')),
    priority: 0,
  },
  {
    name: 'NodeJS',
    type: 'nodejs',
    language: 'javascript',
    expectedRegexp: RegExp([`app.json`, `package.json`, `gulpfile.js`, `Gruntfile.js`].join('|')),
    priority: 0,
  },
  {
    name: 'Modern Web App',
    type: 'modern-webapp',
    language: 'javascript',
    expectedRegexp: RegExp([`app.json`, `package.json`, `gulpfile.js`, `Gruntfile.js`].join('|')),
    customDetection: async (gitService) => {
      const packageJson = await gitService.getPackageJsonContent();
      return isModernWebApp(packageJson);
    },
    priority: 1,
  },
  {
    name: 'PHP',
    type: 'php',
    language: 'php',
    expectedRegexp: RegExp([`index.php`, `composer.json`].join('|')),
    priority: 0,
  },
  {
    name: 'Python',
    type: 'python',
    language: 'python',
    expectedRegexp: RegExp([`requirements.txt`, `setup.py`].join('|')),
    priority: 0,
  },
  {
    name: 'Perl',
    type: 'perl',
    language: 'perl',
    expectedRegexp: RegExp([`index.pl`, `cpanfile`].join('|')),
    priority: 0,
  },
  {
    name: 'Dotnet',
    type: 'dotnet',
    language: 'C#',
    expectedRegexp: RegExp([`project.json`, `.*.csproj`].join('|')),
    priority: 0,
  },
];

export const detectBuildTypes = async (gitService: BaseService): Promise<BuildType[]> => {
  const { files } = await gitService.getRepoFileList();

  const buildTypes = await Promise.all(
    BuildTools.map(async (t) => {
      let detected: boolean;
      if (t.customDetection) {
        detected = await t.customDetection(gitService);
      } else {
        detected = files.some((f) => t.expectedRegexp.test(f));
      }
      return detected ? t : null;
    }),
  );

  return buildTypes
    .filter((t) => !!t)
    .sort((t1, t2) => t2.priority - t1.priority)
    .map((t) => ({
      buildType: t.type,
      language: t.language,
      files: [],
    }));
};
