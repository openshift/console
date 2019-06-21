import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceQuotaTableRow, UsageIcon, ResourceUsageRow } from '../../public/components/resource-quota';

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

describe('Check quota table columns by ResourceUsageRow', () => {
  let wrapper: ShallowWrapper;
  const quota = { 'status': {'hard': {'limits.cpu' : 2}, 'used': {'limits.cpu' : 1} } };

  beforeEach(() => {
    wrapper = shallow(<ResourceUsageRow resourceType={'limits.cpu'} quota={quota} />);
  });

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
