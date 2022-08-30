import * as React from 'react';
import { GithubIcon, GitAltIcon, GitlabIcon, BitbucketIcon } from '@patternfly/react-icons';
import { getGitProviderIcon, getLatestRepositoryPLRName } from '../repository-utils';
import { mockRepository } from './repository-mock';

describe('repository-util', () => {
  it('should return latest pipelineRun name', () => {
    const pipelineRunName = getLatestRepositoryPLRName(mockRepository);
    expect(pipelineRunName).toBe('pipeline-as-code-on-pull-request-zpgx7');
  });

  it('getGitProviderIcon should return Github icon', () => {
    const gitProviderIcon = getGitProviderIcon('https://github.com/sclorg/ruby-ex.git');
    expect(gitProviderIcon).toEqual(
      <GithubIcon
        color="currentColor"
        noVerticalAlign={false}
        size="sm"
        title="https://github.com/sclorg/ruby-ex.git"
      />,
    );
  });

  it('getGitProviderIcon should return Gitlab icon', () => {
    const gitProviderIcon = getGitProviderIcon('https://gitlab.com/gitlab-org/gitlab');
    expect(gitProviderIcon).toEqual(
      <GitlabIcon
        color="currentColor"
        noVerticalAlign={false}
        size="sm"
        title="https://gitlab.com/gitlab-org/gitlab"
      />,
    );
  });

  it('getGitProviderIcon should return Bitbucket icon', () => {
    const gitProviderIcon = getGitProviderIcon('https://bitbucket.org/vikram_raj/helloworld');
    expect(gitProviderIcon).toEqual(
      <BitbucketIcon
        color="currentColor"
        noVerticalAlign={false}
        size="sm"
        title="https://bitbucket.org/vikram_raj/helloworld"
      />,
    );
  });

  it('getGitProviderIcon should return default git icon', () => {
    const gitProviderIcon = getGitProviderIcon('https://githube.com/sclorg/ruby-ex.git');
    expect(gitProviderIcon).toEqual(
      <GitAltIcon
        color="currentColor"
        noVerticalAlign={false}
        size="sm"
        title="https://githube.com/sclorg/ruby-ex.git"
      />,
    );
  });
});
