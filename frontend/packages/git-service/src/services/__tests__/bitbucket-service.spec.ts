import * as nock from 'nock';
import { GitSource, RepoFileList, BuildType } from '../../types';
import { BitbucketService } from '../bitbucket-service';
import { DockerFileParser } from '../../utils';

describe('Bitbucket Service', () => {
  const nockBack = nock.back;
  nockBack.setMode('record');

  nockBack.fixtures = `${__dirname}/__nock-fixtures__/bitbucket`;

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
});
