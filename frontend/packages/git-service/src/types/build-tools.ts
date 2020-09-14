export interface BuildTool {
  name: string;
  type: string;
  language: string;
  expectedRegexps: RegExp;
  expectedFiles: string[];
}

export interface BuildType {
  buildType: string;
  language: string;
  files: string[];
}

export const Maven: BuildTool = {
  name: 'Maven',
  type: 'java',
  language: 'java',
  expectedRegexps: RegExp([`pom.xml`].join('|')),
  expectedFiles: ['pom.xml'],
};

export const Gradle: BuildTool = {
  name: 'Gradle',
  type: 'java',
  language: 'java',
  expectedRegexps: RegExp([`.*gradle.*`].join('|')),
  expectedFiles: ['build.gradle', 'gradlew', 'gradlew.bat'],
};

export const Golang: BuildTool = {
  name: 'Golang',
  type: 'golang',
  language: 'go',
  expectedRegexps: RegExp([`.*.go`, `Gopkg.toml`, `glide.yaml`].join('|')),
  expectedFiles: ['main.go', 'Gopkg.toml', 'glide.yaml'],
};

export const Ruby: BuildTool = {
  name: 'Ruby',
  type: 'ruby',
  language: 'ruby',
  expectedRegexps: RegExp([`Gemfile`, `Rakefile`, `config.ru`].join('|')),
  expectedFiles: ['Gemfile', 'Rakefile', 'config.ru'],
};

export const NodeJS: BuildTool = {
  name: 'NodeJS',
  type: 'nodejs',
  language: 'javascript',
  expectedRegexps: RegExp([`app.json`, `package.json`, `gulpfile.js`, `Gruntfile.js`].join('|')),
  expectedFiles: ['app.json', 'package.json', 'gulpfile.js', 'Gruntfile.js'],
};

export const ModernWebApp: BuildTool = {
  name: 'Modern Web App',
  type: 'modern-webapp',
  language: 'javascript',
  expectedRegexps: RegExp([`app.json`, `package.json`, `gulpfile.js`, `Gruntfile.js`].join('|')),
  expectedFiles: ['app.json', 'package.json', 'gulpfile.js', 'Gruntfile.js'],
};

export const PHP: BuildTool = {
  name: 'PHP',
  type: 'php',
  language: 'php',
  expectedRegexps: RegExp([`index.php`, `composer.json`].join('|')),
  expectedFiles: ['index.php', 'composer.json'],
};

export const Python: BuildTool = {
  name: 'Python',
  type: 'python',
  language: 'python',
  expectedRegexps: RegExp([`requirements.txt`, `setup.py`].join('|')),
  expectedFiles: ['requirements.txt', 'setup.py'],
};

export const Perl: BuildTool = {
  name: 'Perl',
  type: 'perl',
  language: 'perl',
  expectedRegexps: RegExp([`index.pl`, `cpanfile`].join('|')),
  expectedFiles: ['index.pl', 'cpanfile'],
};

export const Dotnet: BuildTool = {
  name: 'Dotnet',
  type: 'dotnet',
  language: 'C#',
  expectedRegexps: RegExp([`project.json`, `.*.csproj`].join('|')),
  expectedFiles: ['project.json', 'app.csproj'],
};

export const BuildTools = [
  Dotnet,
  Golang,
  Gradle,
  Maven,
  NodeJS,
  ModernWebApp,
  Perl,
  PHP,
  Python,
  Ruby,
];

export const WebAppDependencies = [
  'react',
  'angular',
  '@angular/core',
  'vue',
  'knockout',
  'knockback',
];
