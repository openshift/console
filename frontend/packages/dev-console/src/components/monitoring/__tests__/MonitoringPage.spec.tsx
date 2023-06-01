import * as React from 'react';
import { shallow } from 'enzyme';
import { PageHeading, HorizontalNav } from '@console/internal/components/utils';
import * as rbacModule from '@console/internal/components/utils/rbac';
import CreateProjectListPage from '../../projects/CreateProjectListPage';
import { PageContents } from '../MonitoringPage';

describe('Monitoring Page ', () => {
  let monPageProps: React.ComponentProps<typeof PageContents>;
  let spyUseAccessReview;

  beforeEach(() => {
    spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
  });

  afterEach(() => {
    spyUseAccessReview.mockReset();
  });

  it('should render ProjectList page when in all-projects namespace', () => {
    monPageProps = {
      match: {
        path: '/dev-monitoring/all-namespaces',
        url: '/dev-monitoring/all-namespaces',
        isExact: true,
        params: {},
      },
    };
    const component = shallow(<PageContents {...monPageProps} />);
    expect(component.find(CreateProjectListPage).exists()).toBe(true);
    expect(component.find(CreateProjectListPage).prop('title')).toBe('Observe');
  });

  it('should render all Tabs of Monitoring page for selected project', () => {
    spyUseAccessReview.mockReturnValue(true);
    const expectedTabs: string[] = ['Dashboard', 'Metrics', 'Alerts', 'Silences', 'Events'];
    monPageProps = {
      match: {
        path: '/dev-monitoring/ns/:ns',
        url: '/dev-monitoring/ns/test-proj',
        isExact: true,
        params: {
          ns: 'test-proj',
        },
      },
    };

    const component = shallow(<PageContents {...monPageProps} />);
    expect(component.find(PageHeading).exists()).toBe(true);
    expect(component.find(PageHeading).prop('title')).toBe('Observe');
    expect(component.find(HorizontalNav).exists()).toBe(true);
    const actualTabs = component
      .find(HorizontalNav)
      .prop('pages')
      .map((page) => page.nameKey.replace('devconsole~', ''));
    expect(actualTabs).toEqual(expectedTabs);
  });

  it('should not render the Alerts tab if user has no access to get prometheousRule resource', () => {
    spyUseAccessReview.mockReturnValue(false);
    const expectedTabs: string[] = ['Dashboard', 'Metrics', 'Events'];
    monPageProps = {
      match: {
        path: '/dev-monitoring/ns/:ns',
        url: '/dev-monitoring/ns/test-proj',
        isExact: true,
        params: {
          ns: 'test-proj',
        },
      },
    };

    const component = shallow(<PageContents {...monPageProps} />);
    const actualTabs = component
      .find(HorizontalNav)
      .prop('pages')
      .map((page) => page.nameKey.replace('devconsole~', ''));
    expect(actualTabs).toEqual(expectedTabs);
  });
});
