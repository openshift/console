import { SecretType } from '@console/internal/components/secrets/create-secret';
import { SecretKind } from '@console/internal/module/k8s';
import { GitSource, GitProvider, SecretType as GitSecretType } from '../types';
import { BaseService } from './base-service';
import { BitbucketService } from './bitbucket-service';
import { GithubService } from './github-service';
import { GitlabService } from './gitlab-service';

export function getGitService(
  repository: string,
  gitProvider: GitProvider,
  ref?: string,
  contextDir?: string,
  secret?: SecretKind,
): BaseService {
  let secretType: GitSecretType;
  let secretContent: any;
  switch (secret?.type) {
    case SecretType.basicAuth:
      secretType = GitSecretType.BASIC_AUTH;
      secretContent = secret.data;
      break;
    case SecretType.sshAuth:
      secretType = GitSecretType.SSH;
      secretContent = secret['ssh-privatekey'];
      break;
    default:
      secretType = GitSecretType.NO_AUTH;
  }
  const gitSource: GitSource = {
    url: repository,
    ref,
    contextDir,
    secretType,
    secretContent,
  };

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
