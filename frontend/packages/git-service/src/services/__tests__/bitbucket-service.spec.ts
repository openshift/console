import { GitSource, RepoFileList } from '../../types';
import { BitbucketService } from '../bitbucket-service';
import { DockerFileParser } from '../../utils';

describe('Bitbucket Service', () => {
  // For some reason this test passes locally but fails on the CI
  xit('should list all files of existing public bitbucket repo', (done: any) => {
    const gitSource: GitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };

    const gitService = new BitbucketService(gitSource);

    return gitService
      .getRepoFileList()
      .then((r: RepoFileList) => {
        expect(r.files.length).toBeGreaterThanOrEqual(1);
        done();
      })
      .catch((err: Error) => {
        done(err);
      });
  });

  xit('should detect no build type', (done: any) => {
    const gitSource: GitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };

    const gitService = new BitbucketService(gitSource);

    return gitService
      .detectBuildType()
      .then((r) => {
        expect(r.length).toEqual(0);
        done();
      })
      .catch((err: Error) => {
        expect(err).toBeNull();
        done(err);
      });
  });

  xit('should return exposed container port', (done: any) => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/akashshinde123/tutorial-react-docker',
    };

    const gitService = new BitbucketService(gitSource);
    return gitService
      .getDockerfileContent()
      .then((content: string) => {
        const parser = new DockerFileParser(content);
        const port = parser.getContainerPort();
        expect(port).toEqual(5000);
        done();
      })
      .catch((err: Error) => done(err));
  });

  xit('should not return exposed container port', (done: any) => {
    const gitSource: GitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };

    const gitService = new BitbucketService(gitSource);

    return gitService
      .getDockerfileContent()
      .then((content: string | null) => {
        expect(content).toBeNull();
        done();
      })
      .catch((err: Error) => {
        expect(err).toBeDefined();
        done();
      });
  });

  xit('should detect Dockerfile', (done: any) => {
    const gitSource: GitSource = {
      url: 'https://bitbucket.org/akashshinde123/tutorial-react-docker',
    };

    const gitService = new BitbucketService(gitSource);
    return gitService
      .isDockerfilePresent()
      .then((r: boolean) => {
        expect(r).toBe(true);
        done();
      })
      .catch((e: Error) => done(e));
  });

  xit('should not detect Dockerfile', (done: any) => {
    const gitSource: GitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };

    const gitService = new BitbucketService(gitSource);

    return gitService
      .isDockerfilePresent()
      .then((r: boolean) => {
        expect(r).toBe(false);
        done();
      })
      .catch((e: Error) => done(e));
  });
});
