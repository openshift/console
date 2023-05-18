import * as React from 'react';
import { shallow } from 'enzyme';
import { mockRepositories } from '../../../test-data/pipeline-data';
import RepositoryDetails from '../RepositoryDetails';

describe('RepositoryDetails', () => {
  it('should not render custom details section when spec url are not available', () => {
    const repositoryWrapper = shallow(<RepositoryDetails obj={mockRepositories[2]} />);
    expect(repositoryWrapper.find('[data-test="pl-repository-customdetails"]').exists()).toBe(
      false,
    );
  });
});
