import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { QuotaGaugeCharts, QuotaScopesList, ResourceQuotaTableRow, ResourceUsageRow, UsageIcon } from '../../public/components/resource-quota';

describe(ResourceQuotaTableRow.displayName, () => {
  let wrapper: ShallowWrapper;

  it('renders usageIconClass with empty UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={0} />);
    expect(wrapper.find('i').hasClass('co-resource-quota-empty')).toBe(true);
  });

  it('renders usageIconClass with almost empty UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={1} />);
    expect(wrapper.find('i').hasClass('pficon-resources-almost-empty')).toBe(true);
  });

  it('renders usageIconClass with almost empty UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={49} />);
    expect(wrapper.find('i').hasClass('pficon-resources-almost-empty')).toBe(true);
  });

  it('renders usageIconClass with almost full UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={50} />);
    expect(wrapper.find('i').hasClass('pficon-resources-almost-full')).toBe(true);
  });

  it('renders usageIconClass with almost full UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={99} />);
    expect(wrapper.find('i').hasClass('pficon-resources-almost-full')).toBe(true);
  });

  it('renders usageIconClass with full UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={100} />);
    expect(wrapper.find('i').hasClass('pficon pficon-resources-full')).toBe(true);
  });

  it('renders usageIconClass with warning UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={101} />);
    expect(wrapper.find('i').hasClass('pficon-warning-triangle-o')).toBe(true);
  });
});

describe('Renders quota table columns by ResourceUsageRow', () => {
  const quota = { 'status': {'hard': {'limits.cpu' : 2}, 'used': {'limits.cpu' : 1} } };
  const wrapper = shallow(<ResourceUsageRow resourceType={'limits.cpu'} quota={quota} />);

  it('renders ResourceUsageRow for each columns', () => {
    const col0 = wrapper.childAt(0);
    expect(col0.text()).toBe('limits.cpu');

    const col1 = wrapper.childAt(1);
    expect(col1.find('.co-resource-quota-icon').exists()).toBe(true);

    const col2 = wrapper.childAt(2);
    expect(col2.text()).toBe('1');

    const col3 = wrapper.childAt(3);
    expect(col3.text()).toBe('2');
  });
});

describe('Renders QuotaGaugeCharts', () => {
  const resourceTypes = ['limits.cpu','requests.memory'];
  const quota = {
    'status': {
      'hard': {
        'limits.cpu': '2',
        'requests.memory': '1Gi',
      },
      'used': {
        'limits.cpu': '0',
        'requests.memory': '2Gi',
      },
    },
  };
  const wrapper = shallow(<QuotaGaugeCharts resourceTypes={resourceTypes} quota={quota} />);
  const chartRow = wrapper.find('.co-resource-quota-chart-row');

  it('renders QuotaGaugeCharts for CPU Request', () => {
    expect(chartRow.find({title:'CPU Request'}).find({centerText:'No Request'}).exists()).toBe(true);
  });

  it('renders QuotaGaugeCharts for CPU Limit', () => {
    expect(chartRow.find({title:'CPU Limit'}).prop('percent')).toBe(0);
  });

  it('renders QuotaGaugeCharts for Memory Request', () => {
    expect(chartRow.find({title:'Memory Request'}).prop('percent')).toBe(200);
  });

  it('renders QuotaGaugeCharts for Memory Limit', () => {
    expect(chartRow.find({title:'Memory Limit'}).find({centerText:'No Limit'}).exists()).toBe(true);
  });
});

describe('Renders quota scopes by QuotaScopesList', () => {
  let wrapper: ShallowWrapper;
  const scopes = ['NotTerminating','NotBestEffort'];
  beforeEach(() => {
    wrapper = shallow(<QuotaScopesList scopes={scopes} />);
  });

  it('renders label for the first scope', () => {
    expect(wrapper.find('.co-resource-quota-scope__label').at(0).text()).toBe('Not Terminating');
  });

  it('renders label for the first description', () => {
    expect(wrapper.find('.co-resource-quota-scope__description').at(0).text()).toContain('pods that do not have an active deadline');
  });

  it('renders label for the second scope', () => {
    expect(wrapper.find('.co-resource-quota-scope__label').at(1).text()).toBe('Not Best Effort');
  });

  it('renders label for the second description', () => {
    expect(wrapper.find('.co-resource-quota-scope__description').at(1).text()).toContain('pods that have at least one resource limit set');
  });
});
