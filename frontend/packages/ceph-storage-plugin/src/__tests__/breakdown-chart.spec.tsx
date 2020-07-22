import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import {
  addAvailable,
  getStackChartStats,
  getLegends,
} from '../components/dashboard-page/storage-dashboard/breakdown-card/utils';
import { breakdownData } from '../__mocks__/breakdown-data';
import {
  BreakdownChart,
  BreakdownChartProps,
  LinkableLegend,
  LinkableLegendProps,
} from '../components/dashboard-page/storage-dashboard/breakdown-card/breakdown-chart';
import { Link } from 'react-router-dom';
import { Chart, ChartBar } from '@patternfly/react-charts';
import { Tooltip } from '@patternfly/react-core';

const stackData = getStackChartStats(breakdownData.top5, breakdownData.humanize);

const chartData = addAvailable(
  stackData,
  breakdownData.capacityAvailable,
  breakdownData.metricTotal,
  breakdownData.humanize,
);

const legends = getLegends(chartData);

describe('<BreakdownChart>', () => {
  let wrapper: ShallowWrapper<BreakdownChartProps>;

  beforeEach(() => {
    wrapper = shallow(
      <BreakdownChart data={chartData} legends={legends} metricModel={breakdownData.fakeModel} />,
    );
  });

  it('Renders <Chart>', () => {
    const chart = wrapper.find(Chart);
    expect(chart.exists()).toBe(true);
    expect(chart.find(ChartBar).length).toBe(chartData.length);
  });
});

describe('<LinkableLegend>', () => {
  let wrapper: ShallowWrapper<LinkableLegendProps>;

  beforeEach(() => {
    wrapper = shallow(<LinkableLegend metricModel={breakdownData.fakeModel} datum={legends[0]} />);
  });

  it('Renders Link', () => {
    expect(wrapper.find(Link).exists()).toBe(true);
  });

  it('Returns tooltip', () => {
    wrapper.setProps({
      datum: { name: 'Other', labelId: 'Other', link: '#', labels: { fill: '#000' } },
    });
    expect(wrapper.find(Tooltip).exists()).toBe(true);
  });
});
