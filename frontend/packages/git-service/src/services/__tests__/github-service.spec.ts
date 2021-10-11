import * as nock from 'nock';
import {
  GitSource,
  BranchList,
  RepoFileList,
  BuildType,
  RepoLanguageList,
  RepoStatus,
} from '../../types';
import { DockerFileParser } from '../../utils';
import { GithubService } from '../github-service';

describe('Github Service', () => {
  const nockBack = nock.back;
  nockBack.setMode('record');

  nockBack.fixtures = `${__dirname}/__nock-fixtures__/github`;

  it('should return ok on existing public github repo', () => {
    const gitSource: GitSource = {
      url: 'https://github.com/redhat-developer/devconsole-git',
    };

    const gitService = new GithubService(gitSource);

    return nockBack('repo.json').then(async ({ nockDone, context }) => {
      const repoStatus = await gitService.isRepoReachable();
      expect(repoStatus).toEqual(RepoStatus.Reachable);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not be able to validate a non existing github repo', () => {
    const gitSource: GitSource = {
      url: 'https://github.com/redhat-developer/dev-git',
    };

    const gitService = new GithubService(gitSource);

    return nockBack('repo-not-reachable.json').then(async ({ nockDone, context }) => {
      const repoStatus = await gitService.isRepoReachable();
      expect(repoStatus).toEqual(RepoStatus.Unreachable);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should list all branches of existing public github repo', () => {
    const gitSource: GitSource = { url: 'https://github.com/redhat-developer/devconsole-git' };

    const gitService = new GithubService(gitSource);

    return nockBack('branches.json').then(async ({ nockDone, context }) => {
      const branchList: BranchList = await gitService.getRepoBranchList();
      expect(branchList.branches.length).toBeGreaterThanOrEqual(1);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should list all files of existing public github repo', () => {
    const gitSource: GitSource = { url: 'https://github.com/redhat-developer/devconsole-git' };

    const gitService = new GithubService(gitSource);

    return nockBack('files-golang.json').then(async ({ nockDone, context }) => {
      const fileList: RepoFileList = await gitService.getRepoFileList();
      expect(fileList.files.length).toBeGreaterThanOrEqual(1);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect golang build type', () => {
    const gitSource: GitSource = { url: 'https://github.com/redhat-developer/devconsole-git' };

    const gitService = new GithubService(gitSource);

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
      url: 'https://github.com/jboss-openshift/openshift-quickstarts',
    };

    const gitService = new GithubService(gitSource);

    return nockBack('files-not-golang.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBe(0);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect modern-webapp build type', () => {
    const gitSource: GitSource = { url: 'https://github.com/nodeshift-starters/react-web-app' };

    const gitService = new GithubService(gitSource);

    return nockBack('files-modern-webapp.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('modern-webapp');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect nodejs build type', () => {
    const gitSource: GitSource = { url: 'https://github.com/sclorg/nodejs-ex' };

    const gitService = new GithubService(gitSource);

    return nockBack('files-nodejs.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('nodejs');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should use persisted git service metadata and detect java build type', () => {
    const gitSource: GitSource = { url: 'https://github.com/rohitkrai03/spring-petclinic' };

    const gitService = new GithubService(gitSource);

    return nockBack('files-java.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('java');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Golang language', () => {
    const gitSource: GitSource = { url: 'https://github.com/redhat-developer/devconsole-git' };

    const gitService = new GithubService(gitSource);

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
      url: 'https://github.com/redhat-developer/s2i-dotnetcore-ex',
      contextDir: 'app',
    };

    const gitService = new GithubService(gitSource);

    return nockBack('files-dotnet.json').then(async ({ nockDone, context }) => {
      const buildTypes: BuildType[] = await gitService.detectBuildTypes();
      expect(buildTypes.length).toBeGreaterThanOrEqual(1);
      expect(buildTypes[0].buildType).toBe('dotnet');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Dockerfile', () => {
    const gitSource = {
      url: 'https://github.com/mikesparr/tutorial-react-docker',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new GithubService(gitSource);

    return nockBack('dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should return exposed container port', () => {
    const gitSource = {
      url: 'https://github.com/mikesparr/tutorial-react-docker',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new GithubService(gitSource);

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
    const gitSource: GitSource = {
      url: 'https://github.com/redhat-developer/devconsole-git',
      dockerfilePath: 'Dockerfile',
    };

    const gitService = new GithubService(gitSource);

    return nockBack('no-dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Devfile', () => {
    const gitSource = { url: 'https://github.com/reginapizza/che', devfilePath: 'devfile.yaml' };

    const gitService = new GithubService(gitSource);

    return nockBack('devfile.json').then(async ({ nockDone, context }) => {
      const isDevfilePresent = await gitService.isDevfilePresent();
      expect(isDevfilePresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should not detect Devfile', () => {
    const gitSource: GitSource = {
      url: 'https://github.com/redhat-developer/devconsole-git',
      devfilePath: 'devfile.yaml',
    };

    const gitService = new GithubService(gitSource);

    return nockBack('no-devfile.json').then(async ({ nockDone, context }) => {
      const isDevfilePresent = await gitService.isDevfilePresent();
      expect(isDevfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });
});
