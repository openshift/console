import * as React from 'react';
import { shallow } from 'enzyme';
import { BreadCrumbs } from '@console/internal/components/utils';
import { ProjectDetailsPage } from '../ProjectDetailsPage';
import ProjectListPage from '../../ProjectListPage';
import NamespacedPage from '../../../NamespacedPage';
import { DetailsPage } from '@console/internal/components/factory';

const testProjectMatch = { url: '', params: { ns: 'test-project' }, isExact: true, path: '' };
const allNamespaceMatch = { url: '', params: {}, isExact: true, path: '' };

describe('ProjectDetailsPage', () => {
  it('expect ProjectDetailsPage to render the project list page when in the all-projects namespace', () => {
    const component = shallow(<ProjectDetailsPage match={allNamespaceMatch} />);

    expect(component.find(ProjectListPage).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage to show a namespaced details page for a namespace', () => {
    const component = shallow(<ProjectDetailsPage match={testProjectMatch} />);

    expect(component.find(NamespacedPage).exists()).toBe(true);
    expect(component.find(DetailsPage).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage not to render breadcrumbs', () => {
    // Currently rendering the breadcrumbs will buck-up against the redirects and not work as expected
    const component = shallow(<ProjectDetailsPage match={testProjectMatch} />);

    expect(component.find(BreadCrumbs).exists()).not.toBe(true);
  });
});
