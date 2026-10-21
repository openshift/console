import * as nock from 'nock';
import type { GitSource, BranchList, RepoFileList, BuildType, RepoLanguageList } from '../../types';
import { RepoStatus } from '../../types';
import { DockerFileParser } from '../../utils';
import { GitlabService } from '../gitlab-service';

describe('Gitlab Service', () => {
  const nockBack = nock.back;
  nockBack.setMode('record');

  nockBack.fixtures = `${__dirname}/__nock-fixtures__/gitlab`;

  it('should return ok on existing public gitlab repo', () => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);

    const metaData = gitService.getRepoMetadata();
    expect(metaData).toEqual({
      repoName: 'devconsole-git',
      owner: 'jpratik999',
      host: 'https://gitlab.com',
      fullName: 'jpratik999/devconsole-git',
      contextDir: '',
    });

    return nockBack('repo.json').then(async ({ nockDone, context }) => {
      const repoStatus = await gitService.isRepoReachable();
      expect(repoStatus).toEqual(RepoStatus.Reachable);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not be able to validate a non existing gitlab repo', () => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik99/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);

    const metaData = gitService.getRepoMetadata();
    expect(metaData).toEqual({
      repoName: 'devconsole-git',
      owner: 'jpratik99',
      host: 'https://gitlab.com',
      fullName: 'jpratik99/devconsole-git',
      contextDir: '',
    });

    return nockBack('repo-not-reachable.json').then(async ({ nockDone, context }) => {
      const repoStatus = await gitService.isRepoReachable();
      expect(repoStatus).toEqual(RepoStatus.Unreachable);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should return ok on public custom domain with subdomain', async () => {
    const gitSource: GitSource = { url: 'https://version.helsinki.fi/random-user/public-project' };

    const gitService = new GitlabService(gitSource);

    const metaData = gitService.getRepoMetadata();
    expect(metaData).toEqual({
      repoName: 'public-project',
      owner: 'random-user',
      host: 'https://version.helsinki.fi',
      fullName: 'random-user/public-project',
      contextDir: '',
    });

    return nockBack('custom-domain-with-subdomain.json').then(async ({ nockDone, context }) => {
      const repoStatus = await gitService.isRepoReachable();
      expect(repoStatus).toEqual(RepoStatus.Reachable);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should list all branches of existing public gitlab repo', () => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);
    return nockBack('branches.json').then(async ({ nockDone, context }) => {
      const branchList: BranchList = await gitService.getRepoBranchList();
      expect(branchList.branches.length).toBeGreaterThanOrEqual(1);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should list all files of existing public gitlab repo', () => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);

    return nockBack('files.json').then(async ({ nockDone, context }) => {
      const fileList: RepoFileList = await gitService.getRepoFileList();
      expect(fileList.files.length).toBeGreaterThanOrEqual(1);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect golang build type', () => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);

    return nockBack('files.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('golang');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect DotNet build type inside context directory', () => {
    const gitSource: GitSource = {
      url: 'https://gitlab.com/rottencandy/s2i-dotnetcore-ex',
      contextDir: 'app',
    };

    const gitService = new GitlabService(gitSource);

    return nockBack('files-dotnet.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('dotnet');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should remove leading slash from context directory', () => {
    const gitSource: GitSource = {
      url: 'https://gitlab.com/rottencandy/s2i-dotnetcore-ex',
      contextDir: '/app',
    };
    const gitService = new GitlabService(gitSource);

    const metaData = gitService.getRepoMetadata();
    expect(metaData.contextDir).toEqual('app');
  });

  it('should detect Golang language', () => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);

    return nockBack('languages.json').then(async ({ nockDone, context }) => {
      const languageList: RepoLanguageList = await gitService.getRepoLanguageList();
      expect(languageList.languages.length).toBeGreaterThanOrEqual(1);
      expect(languageList.languages).toContain('Go');
      expect(languageList.languages).not.toContain('Java');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Dockerfile', () => {
    const gitSource = {
      url: 'https://gitlab.com/jpratik999/tutorial-react-docker.git',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new GitlabService(gitSource);

    return nockBack('dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should return exposed container port', () => {
    const gitSource = {
      url: 'https://gitlab.com/jpratik999/tutorial-react-docker.git',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new GitlabService(gitSource);

    return nockBack('dockerfile.json').then(async ({ nockDone, context }) => {
      const dockerfileContent = await gitService.getDockerfileContent();
      const parser = new DockerFileParser(dockerfileContent);
      const port = parser.getContainerPort();
      expect(port).toEqual(5000);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect Dockerfile', () => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);

    return nockBack('no-dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Devfile', () => {
    const gitSource = {
      url: 'https://gitlab.com/aballant/nodejs-starter-devfile',
      devfilePath: 'devfile.yaml',
    };

    const gitService = new GitlabService(gitSource);

    return nockBack('devfile.json').then(async ({ nockDone, context }) => {
      const isDevfilePresent = await gitService.isDevfilePresent();
      expect(isDevfilePresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect Devfile', () => {
    const gitSource: GitSource = {
      url: 'https://gitlab.com/jpratik999/devconsole-git.git',
      devfilePath: 'devfile.yaml',
    };

    const gitService = new GitlabService(gitSource);

    return nockBack('no-devfile.json').then(async ({ nockDone, context }) => {
      const isDevfilePresent = await gitService.isDevfilePresent();
      expect(isDevfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect .tekton folder', () => {
    const gitSource = {
      url: 'https://gitlab.com/avikkundu/oc-pipe',
    };

    const gitService = new GitlabService(gitSource);

    return nockBack('tekton.json').then(async ({ nockDone, context }) => {
      const isTektonFolderPresent = await gitService.isTektonFolderPresent();
      expect(isTektonFolderPresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect .tekton folder', () => {
    const gitSource: GitSource = {
      url: 'https://gitlab.com/jpratik999/devconsole-git.git',
    };

    const gitService = new GitlabService(gitSource);

    return nockBack('no-tekton.json').then(async ({ nockDone, context }) => {
      const isTektonFolderPresent = await gitService.isTektonFolderPresent();
      expect(isTektonFolderPresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect func.yaml file', () => {
    const gitSource = {
      url: 'https://gitlab.com/avikkundu/oc-func',
    };

    const gitService = new GitlabService(gitSource);

    return nockBack('func-yaml.json').then(async ({ nockDone, context }) => {
      const isFuncYamlPresent = await gitService.isFuncYamlPresent();
      expect(isFuncYamlPresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect func.yaml file', () => {
    const gitSource: GitSource = {
      url: 'https://gitlab.com/jpratik999/devconsole-git.git',
    };

    const gitService = new GitlabService(gitSource);

    return nockBack('no-func-yaml.json').then(async ({ nockDone, context }) => {
      const isFuncYamlPresent = await gitService.isFuncYamlPresent();
      expect(isFuncYamlPresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should make API call to specified hostname', async () => {
    const gitSource: GitSource = { url: 'https://example.com/test/repo' };
    const gitService = new GitlabService(gitSource);

    const scope = nock('https://example.com/api/v4')
      .get('/projects/test%2Frepo')
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .reply(200, { path_with_namespace: 'test/repo' });

    const status = await gitService.isRepoReachable();
    expect(status).toEqual(RepoStatus.Reachable);
    scope.done();
  });

  it('should preserve scheme and port when making API call to specified hostname', async () => {
    const gitSource: GitSource = { url: 'http://example.com:3000/test/repo' };
    const gitService = new GitlabService(gitSource);

    const scope = nock('http://example.com:3000/api/v4')
      .get('/projects/test%2Frepo')
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .reply(200, { path_with_namespace: 'test/repo' });

    const status = await gitService.isRepoReachable();
    expect(status).toEqual(RepoStatus.Reachable);
    scope.done();
  });

  describe('getRepoMetadata - Protocol and Port Handling', () => {
    it('should use HTTPS protocol for standard GitLab URL', () => {
      const gitSource: GitSource = { url: 'https://gitlab.com/owner/repo' };
      const gitService = new GitlabService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitlab.com');
    });

    it('should preserve HTTP protocol', () => {
      const gitSource: GitSource = { url: 'http://gitlab.example.com/owner/repo' };
      const gitService = new GitlabService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('http://gitlab.example.com');
    });

    it('should preserve custom port with HTTPS', () => {
      const gitSource: GitSource = { url: 'https://gitlab.example.com:8443/owner/repo' };
      const gitService = new GitlabService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitlab.example.com:8443');
    });

    it('should preserve custom port with HTTP', () => {
      const gitSource: GitSource = { url: 'http://gitlab.example.com:8080/owner/repo' };
      const gitService = new GitlabService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('http://gitlab.example.com:8080');
    });

    it('should default to HTTPS for SSH URLs and preserve port', () => {
      const gitSource: GitSource = { url: 'git@gitlab.example.com:2222/owner/repo.git' };
      const gitService = new GitlabService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitlab.example.com:2222');
    });

    it('should default to HTTPS for git:// protocol URLs', () => {
      const gitSource: GitSource = { url: 'git://gitlab.example.com/owner/repo.git' };
      const gitService = new GitlabService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitlab.example.com');
    });

    it('should preserve non-standard port regardless of original protocol', () => {
      const gitSource: GitSource = { url: 'ssh://git@gitlab.example.com:9999/owner/repo.git' };
      const gitService = new GitlabService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitlab.example.com:9999');
    });

    it('should handle subdomains with custom port', () => {
      const gitSource: GitSource = { url: 'https://version.helsinki.fi:3000/owner/repo' };
      const gitService = new GitlabService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://version.helsinki.fi:3000');
    });
  });
});
