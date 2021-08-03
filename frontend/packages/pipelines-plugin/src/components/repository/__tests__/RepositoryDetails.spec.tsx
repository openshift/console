import * as React from 'react';
import { shallow } from 'enzyme';
import { mockRepositories } from '../../../test-data/pipeline-data';
import RepositoryDetails from '../RepositoryDetails';

describe('RepositoryDetails', () => {
  it('should render branch and eventtype when corresponding specs are available', () => {
    const repositoryWrapper = shallow(<RepositoryDetails obj={mockRepositories[0]} />);
    expect(repositoryWrapper.find('[data-test="pl-repository-customdetails"]').exists()).toBe(true);
    expect(repositoryWrapper.find('[data-test="pl-repository-branch"]').exists()).toBe(true);
    expect(repositoryWrapper.find('[data-test="pl-repository-eventtype"]').exists()).toBe(true);
  });

  it('should not render branch and eventtype when corresponding specs are not available', () => {
    const repositoryWrapper = shallow(<RepositoryDetails obj={mockRepositories[1]} />);
    expect(repositoryWrapper.find('[data-test="pl-repository-customdetails"]').exists()).toBe(true);
    expect(repositoryWrapper.find('[data-test="pl-repository-branch"]').exists()).toBe(false);
    expect(repositoryWrapper.find('[data-test="pl-repository-eventtype"]').exists()).toBe(false);
  });

  it('should not render custom details section when spec url are not available', () => {
    const repositoryWrapper = shallow(<RepositoryDetails obj={mockRepositories[2]} />);
    expect(repositoryWrapper.find('[data-test="pl-repository-customdetails"]').exists()).toBe(
      false,
    );
  });
});
