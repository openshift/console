import * as React from 'react';
import { shallow } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import { PageHeading, HorizontalNav } from '@console/internal/components/utils';
import * as rbacModule from '@console/internal/components/utils/rbac';
import CreateProjectListPage from '../../projects/CreateProjectListPage';
import { PageContents } from '../MonitoringPage';

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

describe('Monitoring Page ', () => {
  let spyUseAccessReview;

  beforeEach(() => {
    spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
  });

  afterEach(() => {
    spyUseAccessReview.mockReset();
  });

  it('should render ProjectList page when in all-projects namespace', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({});
    const component = shallow(<PageContents />);
    expect(component.find(CreateProjectListPage).exists()).toBe(true);
    expect(component.find(CreateProjectListPage).prop('title')).toBe('Observe');
  });

  it('should render all Tabs of Monitoring page for selected project', () => {
    spyUseAccessReview.mockReturnValue(true);
    const expectedTabs: string[] = ['Events'];

    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });
    const component = shallow(<PageContents />);
    expect(component.find(PageHeading).exists()).toBe(true);
    expect(component.find(PageHeading).prop('title')).toBe('Observe');
    expect(component.find(HorizontalNav).exists()).toBe(true);
    const actualTabs = component
      .find(HorizontalNav)
      .prop('pages')
      .map((page) => page.nameKey.replace('devconsole~', ''));
    expect(actualTabs).toEqual(expectedTabs);
  });

  it('should not render the Silences tab if user has no access to get prometheousRule resource', () => {
    spyUseAccessReview.mockReturnValue(false);
    const expectedTabs: string[] = ['Events'];
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });

    const component = shallow(<PageContents />);
    const actualTabs = component
      .find(HorizontalNav)
      .first()
      .prop('pages')
      .map((page) => page.nameKey.replace('devconsole~', ''));
    expect(actualTabs).toEqual(expectedTabs);
  });
});
