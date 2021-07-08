// import { Delays, greeter } from '../src/main';

import { GitProvider } from '../../types';
import { BitbucketService } from '../bitbucket-service';
import { getGitService } from '../git-service';
import { GithubService } from '../github-service';
import { GitlabService } from '../gitlab-service';

describe('Git Service', () => {
  it('should return correct instance of services based on git providers', (done: any) => {
    const gitSource = { url: 'https://bitbucket.org/akshinde/testgitsource' };
    expect(getGitService(gitSource, GitProvider.GITHUB)).toBeInstanceOf(GithubService);
    expect(getGitService(gitSource, GitProvider.GITLAB)).toBeInstanceOf(GitlabService);
    expect(getGitService(gitSource, GitProvider.BITBUCKET)).toBeInstanceOf(BitbucketService);
    done();
  });
});
