import * as React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import * as hooks from '@console/shared/src/hooks';
import AllProjectsDetailList from '../AllProjectsDetailList';

describe('AllProjectsDetailList', () => {
  it('expect AllProjectsDetailList to render redirect when an active namespace is present', () => {
    jest.spyOn(hooks, 'useActiveNamespace').mockReturnValue('test-namespace');
    const component = shallow(<AllProjectsDetailList />);

    expect(component.find(Redirect).exists()).toBe(true);
  });

  it('expect AllProjectDetailsList to not render a redirect when in the all-projects namespace', () => {
    jest.spyOn(hooks, 'useActiveNamespace').mockReturnValue(ALL_NAMESPACES_KEY);
    const component = shallow(<AllProjectsDetailList />);

    expect(component.find(Redirect).exists()).not.toBe(true);
  });
});
