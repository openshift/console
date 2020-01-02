import * as React from 'react';
import { shallow } from 'enzyme';
import { ALL_NAMESPACES_KEY } from '@console/internal/const';
import { HorizontalNav, PageHeading } from '@console/internal/components/utils';
import { MonitoringPage } from '../MonitoringPage';
import ProjectListPage from '../../projects/ProjectListPage';

type MonitoringPageProps = React.ComponentProps<typeof MonitoringPage>;
let monPageProps: MonitoringPageProps;

describe('Monitoring Page ', () => {
  beforeEach(() => {
    monPageProps = {
      activeNamespace: 'test-project',
      match: {
        params: {
          ns: 'test-project',
        },
        isExact: true,
        path: '',
        url: '',
      },
    };
  });

  it('should render ProjectList page when in all-projects namespace', () => {
    monPageProps.activeNamespace = ALL_NAMESPACES_KEY;
    const component = shallow(<MonitoringPage {...monPageProps} />);
    expect(component.find(ProjectListPage).exists()).toBe(true);
    expect(component.find(ProjectListPage).prop('title')).toBe('Monitoring');
  });

  it('should render all Tabs of Monitoring page', () => {
    const expectedTabs: string[] = ['Dashboard', 'Metrics'];
    const component = shallow(<MonitoringPage {...monPageProps} />);
    expect(component.exists()).toBe(true);
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
