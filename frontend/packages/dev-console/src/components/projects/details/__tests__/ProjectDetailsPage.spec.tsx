import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { DetailsPage } from '@console/internal/components/factory';
import * as utils from '@console/internal/components/utils';
import CreateProjectListPage from '../../CreateProjectListPage';
import { ProjectDetailsPage, PageContents } from '../ProjectDetailsPage';

const testProjectMatch = { url: '', params: { ns: 'test-project' }, isExact: true, path: '' };
const allNamespaceMatch = { url: '', params: {}, isExact: true, path: '' };
let spyUseAccessReview;

describe('ProjectDetailsPage', () => {
  beforeEach(() => {
    spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('expect ProjectDetailsPage to render the project list page when in the all-projects namespace', () => {
    spyUseAccessReview.mockReturnValue(true);
    const component = shallow(<PageContents match={allNamespaceMatch} />);

    expect(component.find(CreateProjectListPage).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage to show a namespaced details page for a namespace', () => {
    spyUseAccessReview.mockReturnValue(true);
    const component = shallow(<PageContents match={testProjectMatch} />);
    expect(component.find(DetailsPage).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage not to render breadcrumbs', () => {
    spyUseAccessReview.mockReturnValue(true);
    // Currently rendering the breadcrumbs will buck-up against the redirects and not work as expected
    const component = shallow(<ProjectDetailsPage match={testProjectMatch} />);

    expect(component.find(utils.BreadCrumbs).exists()).not.toBe(true);
  });

  it('should not render the Project Access tab if user has no access to role bindings', () => {
    spyUseAccessReview.mockReturnValue(false);
    const component = shallow(<PageContents match={testProjectMatch} />);
    const pages = component.find(DetailsPage).prop('pages');
    expect(_.find(pages, { name: 'Project Access' })).toBe(undefined);
  });
});
