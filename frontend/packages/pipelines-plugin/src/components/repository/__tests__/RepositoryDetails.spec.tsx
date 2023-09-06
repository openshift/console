import * as React from 'react';
import { shallow } from 'enzyme';
import { mockRepositories } from '../../../test-data/pipeline-data';
import RepositoryDetails from '../RepositoryDetails';

jest.mock('@console/pipelines-plugin/src/components/repository/hooks/pac-hook', () => ({
  usePacInfo: jest.fn().mockReturnValue([
    {
      data: {
        'controller-url':
          'https://pipelines-as-code-controller-openshift-pipelines.apps.daily-4.13-040301.dev.openshiftappsvc.org',
      },
    },
    true,
  ]),
}));

describe('RepositoryDetails', () => {
  it('should not render custom details section when spec url are not available', () => {
    const repositoryWrapper = shallow(<RepositoryDetails obj={mockRepositories[2]} />);
    expect(repositoryWrapper.find('[data-test="pl-repository-customdetails"]').exists()).toBe(
      false,
    );
    expect(repositoryWrapper.find('[data-test="git-provider-username"]').exists()).toBe(false);
    expect(repositoryWrapper.find('[data-test="git-provider-secret-name"]').exists()).toBe(false);
    expect(repositoryWrapper.find('[data-test="webhook-url"]').exists()).toBe(false);
    expect(repositoryWrapper.find('[data-test="git-provider-webhook-secret-name"]').exists()).toBe(
      false,
    );
  });

  it('should render username, webhook url and secret details ', () => {
    const repositoryWrapper = shallow(<RepositoryDetails obj={mockRepositories[3]} />);
    expect(repositoryWrapper.find('[data-test="pl-repository-customdetails"]').exists()).toBe(true);
    expect(repositoryWrapper.find('[data-test="git-provider-username"]').exists()).toBe(true);
    expect(repositoryWrapper.find('[data-test="git-provider-secret-name"]').exists()).toBe(true);
    expect(repositoryWrapper.find('[data-test="webhook-url"]').exists()).toBe(true);
    expect(repositoryWrapper.find('[data-test="git-provider-webhook-secret-name"]').exists()).toBe(
      true,
    );
  });
});
