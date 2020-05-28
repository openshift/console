import * as React from 'react';
import { shallow } from 'enzyme';
import { HorizontalNav, PageHeading } from '@console/internal/components/utils';
import { PageContents } from '../MonitoringPage';
import ProjectListPage from '../../projects/ProjectListPage';

describe('Monitoring Page ', () => {
  let monPageProps: React.ComponentProps<typeof PageContents>;

  it('should render ProjectList page when in all-projects namespace', () => {
    monPageProps = {
      match: {
        path: '/dev-monitoring/all-namespaces',
        url: '/dev-monitoring/all-namespaces',
        isExact: true,
        params: {},
      },
      canAccess: true,
    };
    const component = shallow(<PageContents {...monPageProps} />);
    expect(component.find(ProjectListPage).exists()).toBe(true);
    expect(component.find(ProjectListPage).prop('title')).toBe('Monitoring');
  });

  it('should render all Tabs of Monitoring page for selected project', () => {
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
      canAccess: true,
    };

    window.SERVER_FLAGS.prometheusBaseURL = 'http://some-mock-url.com';

    const component = shallow(<PageContents {...monPageProps} />);
    expect(component.find(PageHeading).exists()).toBe(true);
    expect(component.find(PageHeading).prop('title')).toBe('Monitoring');
    expect(component.find(HorizontalNav).exists()).toBe(true);
    const actualTabs = component
      .find(HorizontalNav)
      .prop('pages')
      .map((page) => page.name);
    expect(actualTabs).toEqual(expectedTabs);
  });

  it('should render only events tab of Monitoring page for selected project when user cannot access namespaces', () => {
    const expectedTabs: string[] = ['Events'];
    monPageProps = {
      match: {
        path: '/dev-monitoring/ns/:ns',
        url: '/dev-monitoring/ns/test-proj',
        isExact: true,
        params: {
          ns: 'test-proj',
        },
      },
      canAccess: false,
    };

    window.SERVER_FLAGS.prometheusBaseURL = 'http://some-mock-url.com';

    const component = shallow(<PageContents {...monPageProps} />);
    expect(component.find(PageHeading).exists()).toBe(true);
    expect(component.find(PageHeading).prop('title')).toBe('Monitoring');
    expect(component.find(HorizontalNav).exists()).toBe(true);
    const actualTabs = component
      .find(HorizontalNav)
      .prop('pages')
      .map((page) => page.name);
    expect(actualTabs).toEqual(expectedTabs);
  });

  it('should render only events tab of Monitoring page for selected project when prometheus is disabled', () => {
    const expectedTabs: string[] = ['Events'];
    monPageProps = {
      match: {
        path: '/dev-monitoring/ns/:ns',
        url: '/dev-monitoring/ns/test-proj',
        isExact: true,
        params: {
          ns: 'test-proj',
        },
      },
      canAccess: true,
    };

    window.SERVER_FLAGS.prometheusBaseURL = undefined;

    const component = shallow(<PageContents {...monPageProps} />);
    expect(component.find(PageHeading).exists()).toBe(true);
    expect(component.find(PageHeading).prop('title')).toBe('Monitoring');
    expect(component.find(HorizontalNav).exists()).toBe(true);
    const actualTabs = component
      .find(HorizontalNav)
      .prop('pages')
      .map((page) => page.name);
    expect(actualTabs).toEqual(expectedTabs);
  });
});
