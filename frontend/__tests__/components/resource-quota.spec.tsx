import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceQuotaTableRow, UsageIcon } from '../../public/components/resource-quota';

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

