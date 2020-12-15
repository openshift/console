import * as React from 'react';
import { shallow } from 'enzyme';
import ProjectAccessPage from '../ProjectAccessPage';
import ProjectAccess from '../ProjectAccess';

type ProjectAccessPageProps = React.ComponentProps<typeof ProjectAccessPage>;

describe('Project Access Page', () => {
  it('should render Project Access page', () => {
    const projectAccessPageProps: ProjectAccessPageProps = {
      customData: { activeNamespace: 'abc' },
    };
    const projectAccessPageWrapper = shallow(<ProjectAccessPage {...projectAccessPageProps} />);
    expect(projectAccessPageWrapper.find(ProjectAccess).exists()).toBe(true);
  });
});
