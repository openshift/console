import * as React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { BreadCrumbs } from '@console/internal/components/utils';
import ProjectDetailsPage from '../ProjectDetailsPage';
import * as hooks from '@console/shared/src/hooks';

describe('ProjectDetailsPage', () => {
  it('expect ProjectDetailsPage to render a redirect when in the all-projects namespace', () => {
    jest.spyOn(hooks, 'useActiveNamespace').mockReturnValue(ALL_NAMESPACES_KEY);
    const component = shallow(<ProjectDetailsPage />);

    expect(component.find(Redirect).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage to not render a redirect when a namespace is provided', () => {
    jest.spyOn(hooks, 'useActiveNamespace').mockReturnValue('test-project');
    const component = shallow(<ProjectDetailsPage />);

    expect(component.find(Redirect).exists()).not.toBe(true);
  });

  it('expect ProjectDetailsPage not to render breadcrumbs', () => {
    jest.spyOn(hooks, 'useActiveNamespace').mockReturnValue('test-project');
    // Currently rendering the breadcrumbs will buck-up against the redirects and not work as expected
    const component = shallow(<ProjectDetailsPage />);

    expect(component.find(BreadCrumbs).exists()).not.toBe(true);
  });
});
