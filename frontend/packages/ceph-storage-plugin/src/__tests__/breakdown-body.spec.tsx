import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import {
  BreakdownBodyProps,
  BreakdownCardBody,
} from '../components/dashboards/common/capacity-breakdown/breakdown-body';
import { getStackChartStats } from '../components/dashboards/common/capacity-breakdown/utils';
import { breakdownData } from '../__mocks__/breakdown-data';
import { BreakdownChart } from '../components/dashboards/common/capacity-breakdown/breakdown-chart';
import { TotalCapacityBody } from '../components/dashboards/common/capacity-breakdown/breakdown-capacity';
import { BreakdownChartLoading } from '../components/dashboards/common/capacity-breakdown/breakdown-loading';

const top5MetricsStats = getStackChartStats(breakdownData.top5, breakdownData.humanize);

describe('<BreakdownCardBody>', () => {
  let wrapper: ShallowWrapper<BreakdownBodyProps>;
  beforeEach(() => {
    wrapper = shallow(
      <BreakdownCardBody
        isLoading={false}
        hasLoadError={false}
        metricTotal={breakdownData.metricTotal}
        capacityUsed={breakdownData.capacityUsed}
        capacityAvailable={breakdownData.capacityAvailable}
        humanize={breakdownData.humanize}
        metricModel={null}
        top5MetricsStats={top5MetricsStats}
      />,
    );
  });

  it('Renders Breakdown Chart', () => {
    const breakdownChart = wrapper.find(BreakdownChart);
    expect(breakdownChart.exists()).toBe(true);
    expect(breakdownChart.props().data.length).toBe(7);
    // Last is popped if capacityAvailable is available(7 - 1)
    expect(breakdownChart.props().legends.length).toBe(6);
    expect(breakdownChart.props().ocsVersion).toBeFalsy();
  });

  it('Shows used and available capacity', () => {
    expect(wrapper.find(TotalCapacityBody).exists()).toBe(true);
    expect(wrapper.find('.capacity-breakdown-card__available-body').exists()).toBe(true);
  });

  it('Hides available capacity text, legend, stack', () => {
    wrapper.setProps({ capacityAvailable: null });
    expect(wrapper.find(TotalCapacityBody).exists()).toBe(true);
    expect(wrapper.find('.capacity-breakdown-card__available-body').exists()).toBe(false);
    const breakdownChart = wrapper.find(BreakdownChart);
    expect(breakdownChart.exists()).toBe(true);
    expect(breakdownChart.props().data.length).toBe(6);
    expect(breakdownChart.props().legends.length).toBe(6);
    expect(breakdownChart.props().ocsVersion).toBeFalsy();
  });

  it('Hides others capacity text, legend, stack', () => {
    wrapper.setProps({
      top5MetricsStats: getStackChartStats(breakdownData.top5.slice(0, 4), breakdownData.humanize),
      capacityAvailable: null,
    });
    const breakdownChart = wrapper.find(BreakdownChart);
    expect(breakdownChart.exists()).toBe(true);
    expect(breakdownChart.props().data.length).toBe(4);
    expect(breakdownChart.props().legends.length).toBe(4);
    expect(breakdownChart.props().ocsVersion).toBeFalsy();
  });

  it('Shows usage data warning', () => {
    wrapper.setProps({ capacityUsed: '0' });
    expect(wrapper.text()).toBe('Not enough usage data');
  });

  it('Shows loading state', () => {
    wrapper.setProps({ isLoading: true });
    expect(wrapper.find(BreakdownChartLoading).exists()).toBe(true);
  });

  it('Shows not available', () => {
    wrapper.setProps({ capacityUsed: null, top5MetricsStats: [], hasLoadError: true });
    expect(wrapper.text()).toBe('Not available');
  });
});
