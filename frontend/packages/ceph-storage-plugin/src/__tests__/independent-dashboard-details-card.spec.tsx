import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';

import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { DetailsCard } from '../components/independent-dashboard-page/details-card';
import { dashboardData } from '../__mocks__/independent-mode-dashboard-data';

describe('DetailsCard', () => {
  let wrapper: ShallowWrapper<DashboardItemProps>;

  beforeEach(() => {
    wrapper = shallow(
      <DetailsCard
        watchPrometheus={dashboardData.watchPrometheus as any}
        stopWatchPrometheusQuery={dashboardData.stopWatchPrometheusQuery as any}
        prometheusResults={dashboardData.prometheusResults as any}
        watchURL={dashboardData.watchURL as any}
        stopWatchURL={dashboardData.stopWatchURL as any}
        watchAlerts={dashboardData.watchAlerts as any}
        stopWatchAlerts={dashboardData.stopWatchAlerts as any}
        urlResults={dashboardData.urlResults as any}
        notificationAlerts={dashboardData.notificationAlerts as any}
        watchK8sResource={dashboardData.watchK8sResource as any}
        stopWatchK8sResource={dashboardData.stopWatchK8sResource as any}
        resources={dashboardData.detailResources as any}
      />,
    ).dive();
  });

  it('Should render Card Header', () => {
    expect(wrapper.find(DashboardCardHeader).exists()).toBe(true);
  });

  it('Should render Card Title', () => {
    expect(wrapper.find(DashboardCardTitle).exists()).toBe(true);
  });

  it('Should render details properly', () => {
    expect(wrapper.find('[data-test-id="cluster-name"]').text()).toEqual('foo');
    expect(wrapper.find('[data-test-id="cluster-subscription"]').text()).toEqual('fooVersion');
  });
});
