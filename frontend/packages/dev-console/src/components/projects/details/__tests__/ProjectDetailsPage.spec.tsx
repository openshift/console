import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import * as utils from '@console/internal/components/utils';
import { ProjectDetailsPage, PageContents } from '../ProjectDetailsPage';
import ProjectListPage from '../../ProjectListPage';
import { DetailsPage } from '@console/internal/components/factory';

const testProjectMatch = { url: '', params: { ns: 'test-project' }, isExact: true, path: '' };
const allNamespaceMatch = { url: '', params: {}, isExact: true, path: '' };

describe('ProjectDetailsPage', () => {
  it('expect ProjectDetailsPage to render the project list page when in the all-projects namespace', () => {
    const component = shallow(<PageContents match={allNamespaceMatch} />);

    expect(component.find(ProjectListPage).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage to show a namespaced details page for a namespace', () => {
    const component = shallow(<PageContents match={testProjectMatch} />);
    expect(component.find(DetailsPage).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage not to render breadcrumbs', () => {
    // Currently rendering the breadcrumbs will buck-up against the redirects and not work as expected
    const component = shallow(<ProjectDetailsPage match={testProjectMatch} />);

    expect(component.find(utils.BreadCrumbs).exists()).not.toBe(true);
  });

  it('should not render the Project Access tab if user has no access to role bindings', () => {
    const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(false);
    const component = shallow(<PageContents match={testProjectMatch} />);
    const pages = component.find(DetailsPage).prop('pages');
    expect(_.find(pages, { name: 'Project Access' })).toBe(undefined);
  });
});
