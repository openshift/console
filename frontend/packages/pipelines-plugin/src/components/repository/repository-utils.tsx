import * as React from 'react';
import { GithubIcon, GitAltIcon, GitlabIcon, BitbucketIcon } from '@patternfly/react-icons';
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
