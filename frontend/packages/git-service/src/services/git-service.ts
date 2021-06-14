import { GitSource, GitProvider } from '../types';
import { BaseService } from './base-service';
import { BitbucketService } from './bitbucket-service';
import { GithubService } from './github-service';
import { GitlabService } from './gitlab-service';

export function getGitService(gitSource: GitSource, gitProvider: GitProvider): BaseService {
  switch (gitProvider) {
    case GitProvider.GITHUB:
      return new GithubService(gitSource);
    case GitProvider.BITBUCKET:
      return new BitbucketService(gitSource);
    case GitProvider.GITLAB:
      return new GitlabService(gitSource);
    default:
      return null;
  }
}
