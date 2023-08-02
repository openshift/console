import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import * as Router from 'react-router-dom-v5-compat';
import { DetailsPage } from '@console/internal/components/factory';
import { BreadCrumbs } from '@console/internal/components/utils';
import * as rbacModule from '@console/internal/components/utils/rbac';
import CreateProjectListPage from '../../CreateProjectListPage';
import { ProjectDetailsPage, PageContents } from '../ProjectDetailsPage';

let spyUseAccessReview;

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

describe('ProjectDetailsPage', () => {
  beforeEach(() => {
    spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('expect ProjectDetailsPage to render the project list page when in the all-projects namespace', () => {
    spyUseAccessReview.mockReturnValue(true);
    jest.spyOn(Router, 'useParams').mockReturnValue({});
    const component = shallow(<PageContents />);
    expect(component.find(CreateProjectListPage).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage to show a namespaced details page for a namespace', () => {
    spyUseAccessReview.mockReturnValue(true);
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'test-project' });
    const component = shallow(<PageContents />);
    expect(component.find(DetailsPage).exists()).toBe(true);
  });

  it('expect ProjectDetailsPage not to render breadcrumbs', () => {
    spyUseAccessReview.mockReturnValue(true);
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'test-project' });
    // Currently rendering the breadcrumbs will buck-up against the redirects and not work as expected
    const component = shallow(<ProjectDetailsPage />);
    expect(component.find(BreadCrumbs).exists()).not.toBe(true);
  });

  it('should not render the Project Access tab if user has no access to role bindings', () => {
    spyUseAccessReview.mockReturnValue(false);
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'test-project' });
    const component = shallow(<PageContents />);
    const pages = component.find(DetailsPage).first().prop('pages');
    expect(_.find(pages, { name: 'Project Access' })).toBe(undefined);
  });
});
