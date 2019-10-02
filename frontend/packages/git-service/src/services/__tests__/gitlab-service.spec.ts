import * as assert from 'assert';
import { GitSource } from '../../types';
import { GitlabService } from '../gitlab-service';
import { DockerFileParser } from '../../utils';

describe('Gitlab Service', () => {
  it('should return ok on existing public gitlab repo', (done: any) => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);
    return gitService
      .isRepoReachable()
      .then((isReachable: boolean) => {
        expect(isReachable).toEqual(true);
        done();
      })
      .catch((err: Error) => {
        assert.fail(`Repo is existing${err.toString()}`);
        done();
      });
  });

  it('should list all branches of existing public gitlab repo', (done: any) => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);
    return gitService
      .getRepoBranchList()
      .then((r: any) => {
        assert.ok('List of branches', r);
        done();
      })
      .catch((err: Error) => {
        done(err);
        assert.fail('Repo is existing');
      });
  });

  it('should list all files of existing public gitlab repo', (done: any) => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);
    return gitService
      .getRepoFileList()
      .then((r) => {
        expect(r.files.length).toBeGreaterThanOrEqual(1);
        done();
      })
      .catch((err: Error) => {
        expect(err).toBeNull();
        assert.fail('Failed to list files in the repo');
        done(err);
      });
  });

  it('should detect golang build type', (done: any) => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);
    return gitService
      .detectBuildType()
      .then((r) => {
        expect(r.length).toBeGreaterThanOrEqual(1);
        expect(r[0].buildType).toBe('golang');
        done();
      })
      .catch((err: Error) => {
        expect(err).toBeNull();
        assert.fail('Failed to detect build type');
        done(err);
      });
  });

  it('should detect Golang language', (done: any) => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);
    return gitService
      .getRepoLanguageList()
      .then((r) => {
        expect(r.languages.length).toBeGreaterThanOrEqual(1);
        expect(r.languages).toContain('Go');
        done();
      })
      .catch((err: Error) => {
        expect(err).toBeNull();
        assert.fail('Failed to detect build type');
        done(err);
      });
  });

  it('should return exposed container port', (done: any) => {
    const gitSource = { url: 'https://gitlab.com/jpratik999/tutorial-react-docker.git' };

    const gitService = new GitlabService(gitSource);
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

  it('should detect Dockerfile', (done: any) => {
    const gitSource = { url: 'https://gitlab.com/jpratik999/tutorial-react-docker.git' };

    const gitService = new GitlabService(gitSource);
    return gitService
      .isDockerfilePresent()
      .then((r: boolean) => {
        expect(r).toBe(true);
        done();
      })
      .catch((e: Error) => done(e));
  });

  it('should not detect Dockerfile', (done: any) => {
    const gitSource: GitSource = { url: 'https://gitlab.com/jpratik999/devconsole-git.git' };

    const gitService = new GitlabService(gitSource);
    return gitService
      .isDockerfilePresent()
      .then((r: boolean) => {
        expect(r).toBe(false);
        done();
      })
      .catch((e: Error) => done(e));
  });
});
