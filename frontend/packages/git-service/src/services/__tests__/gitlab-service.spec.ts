import * as nock from 'nock';
import { GitSource, BranchList, RepoFileList, BuildType, RepoLanguageList } from '../../types';
import { GitlabService } from '../gitlab-service';
import { DockerFileParser } from '../../utils';

describe('Gitlab Service', () => {
  const nockBack = nock.back;
  nockBack.setMode('record');

  nockBack.fixtures = `${__dirname}/__nock-fixtures__/gitlab`;

  it('should return ok on existing public gitlab repo', () => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);

    return nockBack('repo.json').then(async ({ nockDone, context }) => {
      const isReachable = await gitService.isRepoReachable();
      expect(isReachable).toEqual(true);
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

  it('should detect Golang language', () => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);

    return nockBack('languages.json').then(async ({ nockDone, context }) => {
      const languageList: RepoLanguageList = await gitService.getRepoLanguageList();
      expect(languageList.languages.length).toBeGreaterThanOrEqual(1);
      expect(languageList.languages).toContain('Go');
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should detect Dockerfile', () => {
    const gitSource = { url: 'https://gitlab.com/jpratik999/tutorial-react-docker.git' };

    const gitService = new GitlabService(gitSource);

    return nockBack('dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(true);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should return exposed container port', () => {
    const gitSource = { url: 'https://gitlab.com/jpratik999/tutorial-react-docker.git' };

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
});
