import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';

import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { Select } from '@patternfly/react-core';
import { BreakdownCard } from '../components/independent-dashboard-page/breakdown-card';
import { dashboardData } from '../__mocks__/independent-mode-dashboard-data';
import { HeaderPrometheusViewLink } from '../components/dashboard-page/storage-dashboard/breakdown-card/breakdown-header';
import { BreakdownCardBody } from '../components/dashboard-page/storage-dashboard/breakdown-card/breakdown-body';
import { getSelectOptions } from '../components/dashboard-page/storage-dashboard/breakdown-card/breakdown-dropdown';
import { breakdownIndependentQueryMap } from '../constants/queries';

describe('BreakdownCard', () => {
  let wrapper: ShallowWrapper<DashboardItemProps>;
  const keys = Object.keys(breakdownIndependentQueryMap);
  const breakdownSelectItems = getSelectOptions(keys);
  beforeEach(() => {
    wrapper = shallow(
      <BreakdownCard
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
      />,
    ).dive();
  });

  it('Should render Card Header', () => {
    expect(wrapper.find(DashboardCardHeader).exists()).toBe(true);
  });

  it('Should render Card Title', () => {
    expect(wrapper.find(DashboardCardTitle).exists()).toBe(true);
  });

  it('Should render Prometheus Header Link', () => {
    expect(wrapper.find(HeaderPrometheusViewLink).exists()).toBe(true);
    expect(wrapper.find(HeaderPrometheusViewLink).props().link).toEqual(
      dashboardData.expectedHeaderLink,
    );
  });

  it('Should render Dropdown', () => {
    expect(wrapper.find(Select).exists()).toBe(true);
    expect(wrapper.find(Select).props().children).toEqual(breakdownSelectItems);
  });

  it('Should render Card body', () => {
    expect(wrapper.find(DashboardCardBody).exists()).toBe(true);
  });

  it('Should render Breakdown Card body', () => {
    expect(wrapper.find(BreakdownCardBody).exists()).toBe(true);
    expect(wrapper.find(BreakdownCardBody).props().isLoading).toBe(true);
    expect(wrapper.find(BreakdownCardBody).props().hasLoadError).toBe(false);
  });
});
