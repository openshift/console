import * as nock from 'nock';
import { GitSource, RepoFileList, BuildType, BranchList, RepoLanguageList } from '../../types';
import { BitbucketService } from '../bitbucket-service';
import { DockerFileParser } from '../../utils';

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
      const isReachable = await gitService.isRepoReachable();
      expect(isReachable).toEqual(true);
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
      const isReachable = await gitService.isRepoReachable();
      expect(isReachable).toEqual(false);
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
      url: 'https://bitbucket.org/akashshinde123/tutorial-react-docker',
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
      url: 'https://bitbucket.org/akashshinde123/tutorial-react-docker',
    };

    const gitService = new BitbucketService(gitSource);

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
    const gitSource: GitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };

    const gitService = new BitbucketService(gitSource);

    return nockBack('no-dockerfile.json').then(async ({ nockDone, context }) => {
      const isDockerfilePresent = await gitService.isDockerfilePresent();
      expect(isDockerfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });

  it('should return null as dockerfile content', () => {
    const gitSource: GitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };

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
    const gitSource: GitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };

    const gitService = new BitbucketService(gitSource);

    return nockBack('no-devfile.json').then(async ({ nockDone, context }) => {
      const isDevfilePresent = await gitService.isDevfilePresent();
      expect(isDevfilePresent).toBe(false);
      context.assertScopesFinished();
      nockDone();
    });
  });
});
