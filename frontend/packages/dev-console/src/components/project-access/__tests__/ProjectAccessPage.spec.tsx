import * as React from 'react';
import { shallow } from 'enzyme';
import ProjectAccessPage from '../ProjectAccessPage';
import RenderProjectAccess from '../RenderProjectAccessPage';
import NamespacedPage from '../../NamespacedPage';

describe('Project Access Page', () => {
  const projectAccessPageProps: React.ComponentProps<typeof ProjectAccessPage> = {
    match: {
      isExact: true,
      path: `/project-access/ns/:ns`,
      url: ``,
      params: {
        ns: 'default',
      },
    },
  };
  const wrapper = shallow(<ProjectAccessPage {...projectAccessPageProps} />);
  it('should have the NamespacedPage Component', () => {
    expect(wrapper.find(NamespacedPage).exists()).toBeTruthy();
  });
  it('should render the RenderProjectAccessPage Component', () => {
    expect(wrapper.find(RenderProjectAccess).exists()).toBeTruthy();
  });
});
