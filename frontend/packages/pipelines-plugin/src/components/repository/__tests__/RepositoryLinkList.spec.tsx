import * as React from 'react';
import { shallow } from 'enzyme';
import { PipeLineRunWithRepoMetadata } from '../../../test-data/pipeline-data';
import { getLabelValue, sanitizeBranchName } from '../repository-utils';
import RepositoryLinkList from '../RepositoryLinkList';

jest.mock('../repository-utils', () => ({
  getLabelValue: jest.fn(),
  sanitizeBranchName: jest.fn(),
}));

const getLabelValueMock = getLabelValue as jest.Mock;
const sanitizeBranchNameMock = sanitizeBranchName as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  getLabelValueMock.mockReturnValue('pipelines-plugin~Branch');
  sanitizeBranchNameMock.mockReturnValue('main');
});

describe('RepositoryLinkList', () => {
  it('should not render when repo label is missing', () => {
    const repositoryWrapper = shallow(
      <RepositoryLinkList pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithNoRepoLabel} />,
    );
    expect(repositoryWrapper.isEmptyRender()).toBe(true);
  });

  it('should render repository links when repo label is present', () => {
    const repositoryWrapper = shallow(
      <RepositoryLinkList pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithRepoLabel} />,
    );
    expect(repositoryWrapper.find('[data-test="pl-repository-link"]').exists()).toBe(true);
  });

  it('should render repository branch details when repo & branch label are present', () => {
    const repositoryWrapper = shallow(
      <RepositoryLinkList pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithBranchLabel} />,
    );
    expect(repositoryWrapper.find('[data-test="pl-repository-branch"]').exists()).toBe(true);
  });

  it('should render commit id when repo & sha label are present', () => {
    const repositoryWrapper = shallow(
      <RepositoryLinkList pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithSHALabel} />,
    );
    expect(repositoryWrapper.find('[data-test="pl-sha-url"]').exists()).toBe(true);
  });

  it('should render event type when repo & EventType label are present', () => {
    const repositoryWrapper = shallow(
      <RepositoryLinkList
        pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithEventTypeLabel}
      />,
    );
    expect(repositoryWrapper.find('[data-test="pl-event-type"]').exists()).toBe(true);
  });
});
