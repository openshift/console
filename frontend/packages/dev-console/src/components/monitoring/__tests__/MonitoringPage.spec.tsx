import * as React from 'react';
import { shallow } from 'enzyme';
import * as utils from '@console/internal/components/utils';
import { PageContents } from '../MonitoringPage';
import CreateProjectListPage from '../../projects/CreateProjectListPage';

describe('Monitoring Page ', () => {
  let monPageProps: React.ComponentProps<typeof PageContents>;
  const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
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
    expect(component.find(CreateProjectListPage).prop('title')).toBe('Monitoring');
  });

  it('should render all Tabs of Monitoring page for selected project', () => {
    spyUseAccessReview.mockReturnValue(true);
    const expectedTabs: string[] = ['Dashboard', 'Metrics', 'Alerts', 'Events'];
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
    expect(component.find(utils.PageHeading).exists()).toBe(true);
    expect(component.find(utils.PageHeading).prop('title')).toBe('Monitoring');
    expect(component.find(utils.HorizontalNav).exists()).toBe(true);
    const actualTabs = component
      .find(utils.HorizontalNav)
      .prop('pages')
      .map((page) => page.name);
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
      .find(utils.HorizontalNav)
      .prop('pages')
      .map((page) => page.name);
    expect(actualTabs).toEqual(expectedTabs);
  });
});
