import * as nock from 'nock';
import type { GitSource, RepoFileList, BuildType, BranchList, RepoLanguageList } from '../../types';
import { RepoStatus } from '../../types';
import { DockerFileParser } from '../../utils';
import { BitbucketService } from '../bitbucket-service';

describe('Bitbucket Service', () => {
  const nockBack = nock.back;
  nockBack.setMode('record');

  nockBack.fixtures = `${__dirname}/__nock-fixtures__/bitbucket`;

  it('should be able to detect existing public bitbucket repo', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/atlassian/confluence-react-components',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('repo.json').then(async ({ nockDone, context }) => {
      const repoStatus = await gitService.isRepoReachable();
      expect(repoStatus).toEqual(RepoStatus.Reachable);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not be able to detect a bitbucket repo that doesnot exist', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/atlassian/confluencereact-components',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('repo-not-reachable.json').then(async ({ nockDone, context }) => {
      const repoStatus = await gitService.isRepoReachable();
      expect(repoStatus).toEqual(RepoStatus.ResourceNotFound);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should be able to list all the branches of an existing public bitbucket repo', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/atlassian/confluence-react-components',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('branches.json').then(async ({ nockDone, context }) => {
      const branchList: BranchList = await gitService.getRepoBranchList();
      expect(branchList.branches.length).toBeGreaterThanOrEqual(1);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should list all files of existing public bitbucket repo', () => {
    const gitSource: GitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };

    const gitService = new BitbucketService(gitSource);

    return nockBack('files.json').then(async ({ nockDone, context }) => {
      const fileList: RepoFileList = await gitService.getRepoFileList();
      expect(fileList.files.length).toBeGreaterThanOrEqual(1);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should be able to find the list of languages', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/atlassian/aui-react',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('languages.json').then(async ({ nockDone, context }) => {
      const languageList: RepoLanguageList = await gitService.getRepoLanguageList();
      expect(languageList.languages.length).toBeGreaterThanOrEqual(1);
      expect(languageList.languages).toContain('nodejs');
      expect(languageList.languages).not.toContain('Go');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should be able to detect build types', () => {
    const gitSource: GitSource = { url: 'https://bitbucket.org/atlassian/aui-react' };

    const gitService = new BitbucketService(gitSource);

    return nockBack('files-modern-webapp.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toEqual(2);
      expect(buildTypes[0].buildType).toBe('nodejs');
      expect(buildTypes[1].buildType).toBe('modern-webapp');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect DotNet build type inside context directory', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/rottencandy/s2i-dotnetcore-ex',
      ref: 'dotnetcore-3.1',
      contextDir: 'app',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('files-dotnet.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('dotnet');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect no build type', () => {
    const gitSource: GitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };

    const gitService = new BitbucketService(gitSource);

    return nockBack('files.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toEqual(0);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Dockerfile', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/jerolimov/nodeinfo',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should return exposed container port from dockerfile', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/jerolimov/nodeinfo',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('dockerfile.json').then(async ({ nockDone, context }) => {
      const dockerfileContent = await gitService.getDockerfileContent();
      const parser = new DockerFileParser(dockerfileContent);
      const port = parser.getContainerPort();
      expect(port).toEqual(8080);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect Dockerfile', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/akshinde/testgitsource',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('no-dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should return null as dockerfile content', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/akshinde/testgitsource',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('no-dockerfile.json').then(async ({ nockDone, context }) => {
      const dockerfileContent = await gitService.getDockerfileContent();
      expect(dockerfileContent).toBeNull();
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Devfile', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/reginapizza/che',
      devfilePath: 'devfile.yaml',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('devfile.json').then(async ({ nockDone, context }) => {
      const isDevfilePresent = await gitService.isDevfilePresent();
      expect(isDevfilePresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect devfile', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/akshinde/testgitsource',
      devfilePath: 'devfile.yaml',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('no-devfile.json').then(async ({ nockDone, context }) => {
      const isDevfilePresent = await gitService.isDevfilePresent();
      expect(isDevfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect .tekton folder', () => {
    const gitSource = {
      url: 'https://bitbucket.org/avikkundu/oc-pipe',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('tekton.json').then(async ({ nockDone, context }) => {
      const isTektonFolderPresent = await gitService.isTektonFolderPresent();
      expect(isTektonFolderPresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect .tekton folder', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/akshinde/testgitsource',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('no-tekton.json').then(async ({ nockDone, context }) => {
      const isTektonFolderPresent = await gitService.isTektonFolderPresent();
      expect(isTektonFolderPresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect func.yaml file', () => {
    const gitSource = {
      url: 'https://bitbucket.org/avikkundu/oc-func',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('func.json').then(async ({ nockDone, context }) => {
      const isFuncYamlPresent = await gitService.isFuncYamlPresent();
      expect(isFuncYamlPresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect func.yaml file', () => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/akshinde/testgitsource',
    };

    const gitService = new BitbucketService(gitSource);

    return nockBack('no-func.json').then(async ({ nockDone, context }) => {
      const isFuncYamlPresent = await gitService.isFuncYamlPresent();
      expect(isFuncYamlPresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should preserve scheme and port for Bitbucket Server API calls', async () => {
    const gitSource: GitSource = {
      url: 'http://bb.example.com:7990/scm/PROJ/repo.git',
    };
    const gitService = new BitbucketService(gitSource);

    const scope = nock('http://bb.example.com:7990')
      .get('/rest/api/1.0/projects/PROJ/repos/repo')
      .reply(200, { slug: 'repo' });

    const status = await gitService.isRepoReachable();
    expect(status).toEqual(RepoStatus.Reachable);
    scope.done();
  });

  describe('getRepoMetadata - Protocol and Port Handling', () => {
    it('should use HTTPS protocol for standard Bitbucket URL', () => {
      const gitSource: GitSource = { url: 'https://bitbucket.org/owner/repo' };
      const gitService = new BitbucketService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://bitbucket.org');
    });

    it('should preserve HTTP protocol', () => {
      const gitSource: GitSource = { url: 'http://bitbucket.example.com/owner/repo' };
      const gitService = new BitbucketService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('http://bitbucket.example.com');
    });

    it('should preserve custom port with HTTPS', () => {
      const gitSource: GitSource = { url: 'https://bitbucket.example.com:8443/owner/repo' };
      const gitService = new BitbucketService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://bitbucket.example.com:8443');
    });

    it('should preserve custom port with HTTP', () => {
      const gitSource: GitSource = { url: 'http://bitbucket.example.com:8080/owner/repo' };
      const gitService = new BitbucketService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('http://bitbucket.example.com:8080');
    });

    it('should default to HTTPS for SSH URLs and preserve port', () => {
      const gitSource: GitSource = { url: 'git@bitbucket.example.com:2222/owner/repo.git' };
      const gitService = new BitbucketService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://bitbucket.example.com:2222');
    });

    it('should default to HTTPS for git:// protocol URLs', () => {
      const gitSource: GitSource = { url: 'git://bitbucket.example.com/owner/repo.git' };
      const gitService = new BitbucketService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://bitbucket.example.com');
    });

    it('should preserve non-standard port regardless of original protocol', () => {
      const gitSource: GitSource = { url: 'ssh://git@bitbucket.example.com:9999/owner/repo.git' };
      const gitService = new BitbucketService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('https://bitbucket.example.com:9999');
    });

    it('should handle Bitbucket Server URL with custom port', () => {
      const gitSource: GitSource = {
        url: 'http://bb.example.com:7990/scm/proj/repo.git',
      };
      const gitService = new BitbucketService(gitSource);
      const metadata = gitService.getRepoMetadata();

      expect(metadata.host).toBe('http://bb.example.com:7990');
    });
  });
});
