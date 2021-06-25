import { BaseService } from '../services/base-service';
import { isModernWebApp } from './build-tool-detector';

type BuildTool = {
  name: string;
  type: string;
  language: string;
  expectedRegexp: RegExp;
  priority: number;
  customDetection?: (gitService: BaseService) => Promise<string[]>;
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
    priority: 1,
    customDetection: async (gitService) => {
      const packageJson = await gitService.getPackageJsonContent();
      return isModernWebApp(packageJson) ? ['package.json'] : [];
    },
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

export type DetectedBuildType = {
  name: string;
  type: string;
  language: string;
  priority: number;
  detectedFiles: string[];
};

export const detectBuildTypes = async (gitService: BaseService): Promise<DetectedBuildType[]> => {
  const { files } = await gitService.getRepoFileList();

  const buildTypes = await Promise.all(
    BuildTools.map<Promise<DetectedBuildType>>(async (t) => {
      let detectedFiles: string[] = [];
      if (t.customDetection) {
        detectedFiles = await t.customDetection(gitService);
      } else {
        detectedFiles = files.filter((f) => t.expectedRegexp.test(f));
      }
      return {
        name: t.name,
        type: t.type,
        language: t.language,
        priority: t.priority,
        detectedFiles,
      };
    }),
  );

  return buildTypes
    .filter((t) => !!t.detectedFiles.length)
    .sort((t1, t2) => t2.priority - t1.priority);
};
