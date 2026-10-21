// import { Delays, greeter } from '../src/main';

import { GitProvider } from '../../types';
import { BitbucketService } from '../bitbucket-service';
import { getGitService } from '../git-service';
import { GithubService } from '../github-service';
import { GitlabService } from '../gitlab-service';

describe('Git Service', () => {
  it('should return correct instance of services based on git providers', (done: any) => {
    const gitSourceUrl = 'https://bitbucket.org/akshinde/testgitsource';
    expect(getGitService(gitSourceUrl, GitProvider.GITHUB)).toBeInstanceOf(GithubService);
    expect(getGitService(gitSourceUrl, GitProvider.GITLAB)).toBeInstanceOf(GitlabService);
    expect(getGitService(gitSourceUrl, GitProvider.BITBUCKET)).toBeInstanceOf(BitbucketService);
    done();
  });
});
