import * as React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { BreadCrumbs } from '@console/internal/components/utils';
import { ProjectDetailsPage } from '../ProjectDetailsPage';

describe('ProjectDetailsPage', () => {
  it('expect ProjectDetailsPage to render a redirect when in the all-projects namespace', () => {
    const component = shallow(<ProjectDetailsPage activeNamespace={ALL_NAMESPACES_KEY} />);

    expect(component.find(Redirect).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage to not render a redirect when a namespace is provided', () => {
    const component = shallow(<ProjectDetailsPage activeNamespace="test-project" />);

    expect(component.find(Redirect).exists()).not.toBe(true);
  });

  it('expect ProjectDetailsPage not to render breadcrumbs', () => {
    // Currently rendering the breadcrumbs will buck-up against the redirects and not work as expected
    const component = shallow(<ProjectDetailsPage activeNamespace="test-project" />);

    expect(component.find(BreadCrumbs).exists()).not.toBe(true);
  });
});
