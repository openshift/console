import { BitbucketIcon } from '@patternfly/react-icons/dist/esm/icons/bitbucket-icon';
import { GitAltIcon } from '@patternfly/react-icons/dist/esm/icons/git-alt-icon';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { GitlabIcon } from '@patternfly/react-icons/dist/esm/icons/gitlab-icon';
import { GitProvider } from '@console/git-service/src';
import { detectGitType } from './repository-form-utils';
import { RepositoryKind } from './types';

export const getLatestRepositoryPLRName = (repository: RepositoryKind) => {
  const runNames = repository.pipelinerun_status
    ?.sort((a, b) => {
      if (a.completionTime) {
        return b?.completionTime && new Date(a.completionTime) > new Date(b.completionTime)
          ? 1
          : -1;
      }
      return b?.completionTime || new Date(a?.startTime) > new Date(b.startTime) ? 1 : -1;
    })
    .map((plrStatus) => plrStatus.pipelineRunName);
  return runNames?.length > 0 ? runNames[runNames.length - 1] : '';
};

export const getGitProviderIcon = (url: string) => {
  const gitType = detectGitType(url);

  switch (gitType) {
    case GitProvider.GITHUB: {
      return <GithubIcon title={url} />;
    }
    case GitProvider.GITLAB: {
      return <GitlabIcon title={url} />;
    }
    case GitProvider.BITBUCKET: {
      return <BitbucketIcon title={url} />;
    }
    default: {
      return <GitAltIcon title={url} />;
    }
  }
};

export const getLabelValue = (branchName: string): string => {
  if (branchName?.startsWith('refs/heads/') || branchName?.startsWith('refs-heads-')) {
    return 'pipelines-plugin~Branch';
  }

  if (branchName?.startsWith('refs/tags/') || branchName?.startsWith('refs-tags-')) {
    return 'pipelines-plugin~Tag';
  }
  return 'pipelines-plugin~Branch';
};

export const sanitizeBranchName = (branchName: string): string => {
  if (branchName?.startsWith('refs/heads/')) {
    return branchName.replace('refs/heads/', '');
  }

  if (branchName?.startsWith('refs-heads-')) {
    return branchName.replace('refs-heads-', '');
  }

  if (branchName?.startsWith('refs/tags/')) {
    return branchName.replace('refs/tags/', '');
  }

  if (branchName?.startsWith('refs-tags-')) {
    return branchName.replace('refs-tags-', '');
  }
  return branchName;
};
