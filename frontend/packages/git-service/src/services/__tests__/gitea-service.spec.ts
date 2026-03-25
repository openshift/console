import * as nock from 'nock';
import type { GitSource, BranchList, RepoFileList, BuildType, RepoLanguageList } from '../../types';
import { RepoStatus } from '../../types';
import { GiteaService } from '../gitea-service';

describe('Gitea Service', () => {
  const nockBack = nock.back;
  nockBack.setMode('record');

  nockBack.fixtures = `${__dirname}/__nock-fixtures__/gitea`;

  it('should return ok on existing public gitea repo', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift/devconsole-git',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('repo.json').then(async ({ nockDone, context }) => {
      const repoStatus = await gitService.isRepoReachable();
      expect(repoStatus).toEqual(RepoStatus.Reachable);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not be able to validate a non existing gitea repo', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift/dev-git',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('repo-not-reachable.json').then(async ({ nockDone, context }) => {
      const repoStatus = await gitService.isRepoReachable();
      expect(repoStatus).toEqual(RepoStatus.GiteaRepoUnreachable);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should list all branches of existing public gitea repo', () => {
    const gitSource: GitSource = { url: 'https://gitea.com/redhat-openshift/devconsole-git' };

    const gitService = new GiteaService(gitSource);

    return nockBack('branches.json').then(async ({ nockDone, context }) => {
      const branchList: BranchList = await gitService.getRepoBranchList();
      expect(branchList.branches.length).toBeGreaterThanOrEqual(1);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should list all files of existing public gitea repo', () => {
    const gitSource: GitSource = { url: 'https://gitea.com/redhat-openshift/devconsole-git' };

    const gitService = new GiteaService(gitSource);

    return nockBack('files-golang.json').then(async ({ nockDone, context }) => {
      const fileList: RepoFileList = await gitService.getRepoFileList();
      expect(fileList.files.length).toBeGreaterThanOrEqual(1);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect golang build type', () => {
    const gitSource: GitSource = { url: 'https://gitea.com/redhat-openshift/devconsole-git' };

    const gitService = new GiteaService(gitSource);

    return nockBack('files-golang.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('golang');
      expect(buildTypes[0].buildType).not.toBe('nodejs');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect golang build type', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift/openshift-quickstarts',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('files-not-golang.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBe(0);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect nodejs build type', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift/nodejs-ex',
      ref: 'master',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('files-nodejs.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('nodejs');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should use persisted git service metadata and detect java build type', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift/spring-petclinic',
      ref: 'main',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('files-java.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('java');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Golang language', () => {
    const gitSource: GitSource = { url: 'https://gitea.com/redhat-openshift/devconsole-git' };

    const gitService = new GiteaService(gitSource);

    return nockBack('languages.json').then(async ({ nockDone, context }) => {
      const languageList: RepoLanguageList = await gitService.getRepoLanguageList();
      expect(languageList.languages.length).toBeGreaterThanOrEqual(1);
      expect(languageList.languages).toContain('Go');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect DotNet build type inside context directory', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift-dev/s2i-dotnetcore-ex',
      contextDir: 'app',
      ref: 'dotnet-8.0',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('files-dotnet.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('dotnet');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Dockerfile', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift-dev/tutorial-react-docker',
      ref: 'master',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect Dockerfile', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift/devconsole-git',
      ref: 'master',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('no-dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Devfile', () => {
    const gitSource = {
      url: 'https://gitea.com/redhat-openshift-dev/che',
      ref: 'master',
      devfilePath: 'devfile.yaml',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('devfile.json').then(async ({ nockDone, context }) => {
      const isDevfilePresent = await gitService.isDevfilePresent();
      expect(isDevfilePresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect Devfile', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift/devconsole-git',
      ref: 'master',
      devfilePath: 'devfile.yaml',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('no-devfile.json').then(async ({ nockDone, context }) => {
      const isDevfilePresent = await gitService.isDevfilePresent();
      expect(isDevfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect .tekton folder', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift/devconsole-git',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('no-tekton.json').then(async ({ nockDone, context }) => {
      const isTektonFolderPresent = await gitService.isTektonFolderPresent();
      expect(isTektonFolderPresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect func.yaml file', () => {
    const gitSource = {
      url: 'https://gitea.com/redhat-openshift-dev/oc-func',
      ref: 'master',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('func.json').then(async ({ nockDone, context }) => {
      const isFuncYamlPresent = await gitService.isFuncYamlPresent();
      expect(isFuncYamlPresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect func.yaml file', () => {
    const gitSource: GitSource = {
      url: 'https://gitea.com/redhat-openshift/devconsole-git',
      ref: 'master',
    };

    const gitService = new GiteaService(gitSource);

    return nockBack('no-func.json').then(async ({ nockDone, context }) => {
      const isFuncYamlPresent = await gitService.isFuncYamlPresent();
      expect(isFuncYamlPresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  describe('getRepoMetadata - Protocol and Port Handling', () => {
    it('should use HTTPS protocol for standard Gitea URL', () => {
      const gitSource: GitSource = { url: 'https://gitea.com/owner/repo' };
      const gitService = new GiteaService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitea.com');
    });

    it('should preserve HTTP protocol', () => {
      const gitSource: GitSource = { url: 'http://gitea.example.com/owner/repo' };
      const gitService = new GiteaService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('http://gitea.example.com');
    });

    it('should preserve custom port with HTTPS', () => {
      const gitSource: GitSource = { url: 'https://gitea.example.com:8443/owner/repo' };
      const gitService = new GiteaService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitea.example.com:8443');
    });

    it('should preserve custom port with HTTP', () => {
      const gitSource: GitSource = { url: 'http://gitea.example.com:8080/owner/repo' };
      const gitService = new GiteaService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('http://gitea.example.com:8080');
    });

    it('should default to HTTPS for SSH URLs and preserve port', () => {
      const gitSource: GitSource = { url: 'git@gitea.example.com:2222/owner/repo.git' };
      const gitService = new GiteaService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitea.example.com:2222');
    });

    it('should default to HTTPS for git:// protocol URLs', () => {
      const gitSource: GitSource = { url: 'git://gitea.example.com/owner/repo.git' };
      const gitService = new GiteaService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitea.example.com');
    });

    it('should preserve non-standard port regardless of original protocol', () => {
      const gitSource: GitSource = { url: 'ssh://git@gitea.example.com:9999/owner/repo.git' };
      const gitService = new GiteaService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://gitea.example.com:9999');
    });
  });
});
