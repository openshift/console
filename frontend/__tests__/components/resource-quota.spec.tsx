import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import {
  UsageIcon,
  ResourceUsageRow,
  getACRQResourceUsage,
} from '../../public/components/resource-quota';

// We don't render ResourceUsageRows for cluster-only data, but use it in a Gauge chart
describe('Check getResourceUsage for AppliedClusterResourceQuota', () => {
  const quota = {
    apiVersion: 'quota.openshift.io/v1',
    kind: 'AppliedClusterResourceQuota',
    metadata: { name: 'example' },
    spec: { quota: { hard: { 'limits.cpu': '2' } } },
    status: {
      namespaces: [
        {
          namespace: 'test-namespace',
          status: { used: { 'limits.cpu': '0' }, hard: { 'limits.cpu': '2' } },
        },
        {
          namespace: 'test-namespace2',
          status: { used: { 'limits.cpu': '1' }, hard: { 'limits.cpu': '2' } },
        },
      ],
      total: { hard: { 'limits.cpu': '2' }, used: { 'limits.cpu': '1' } },
    },
  };

  it('Provides correct cluster-only data', () => {
    expect(getACRQResourceUsage(quota, 'limits.cpu')).toEqual({
      used: { cluster: '1', namespace: 0 },
      totalUsed: '1',
      max: '2',
      percent: { namespace: 0, otherNamespaces: 50, unused: 50 },
    });
  });
  it('Provides correct namespaced data', () => {
    expect(getACRQResourceUsage(quota, 'limits.cpu', 'test-namespace')).toEqual({
      used: { cluster: '1', namespace: '0' },
      totalUsed: '1',
      max: '2',
      percent: { namespace: 0, otherNamespaces: 50, unused: 50 },
    });
    expect(getACRQResourceUsage(quota, 'limits.cpu', 'test-namespace2')).toEqual({
      used: { cluster: '1', namespace: '1' },
      totalUsed: '1',
      max: '2',
      percent: { namespace: 50, otherNamespaces: 0, unused: 50 },
    });
  });
});

describe('UsageIcon', () => {
  let wrapper: ShallowWrapper;

  it('renders usageIconClass with empty UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={0} />);
    expect(wrapper.hasClass('co-resource-quota-empty')).toBe(true);
  });

  it('renders usageIconClass with almost empty UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={1} />);
    expect(wrapper.hasClass('co-resource-quota-almost-empty')).toBe(true);
  });

  it('renders usageIconClass with almost empty UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={49} />);
    expect(wrapper.hasClass('co-resource-quota-almost-empty')).toBe(true);
  });

  it('renders usageIconClass with almost full UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={50} />);
    expect(wrapper.hasClass('co-resource-quota-almost-full')).toBe(true);
  });

  it('renders usageIconClass with almost full UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={99} />);
    expect(wrapper.hasClass('co-resource-quota-almost-full')).toBe(true);
  });

  it('renders usageIconClass with full UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={100} />);
    expect(wrapper.hasClass('co-resource-quota-full')).toBe(true);
  });

  it('renders usageIconClass with warning UsageIcon', () => {
    wrapper = shallow(<UsageIcon percent={101} />);
    expect(wrapper.hasClass('co-resource-quota-exceeded')).toBe(true);
  });
});

describe('Check quota table columns by ResourceUsageRow', () => {
  let wrapper: ShallowWrapper;
  const quota = {
    apiVersion: 'v1',
    kind: 'ResourceQuota',
    metadata: { name: 'example', namespace: 'example' },
    spec: { hard: { 'limits.cpu': 2 } },
    status: { hard: { 'limits.cpu': 2 }, used: { 'limits.cpu': 1 } },
  };

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

describe('Check cluster quota table columns by ResourceUsageRow', () => {
  let wrapper: ShallowWrapper;
  const quota = {
    apiVersion: 'quota.openshift.io/v1',
    kind: 'ClusterResourceQuota',
    metadata: { name: 'example' },
    spec: { quota: { hard: { 'limits.cpu': 2 } } },
    status: { total: { hard: { 'limits.cpu': 2 }, used: { 'limits.cpu': 1 } } },
  };

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

describe('Check applied cluster quota table columns by ResourceUsageRow', () => {
  let wrapper: ShallowWrapper;
  const quota = {
    apiVersion: 'quota.openshift.io/v1',
    kind: 'AppliedClusterResourceQuota',
    metadata: { name: 'example' },
    spec: { quota: { hard: { 'limits.cpu': 2 } } },
    status: {
      namespaces: [
        {
          namespace: 'test-namespace',
          status: { used: { 'limits.cpu': 0 }, hard: { 'limits.cpu': 2 } },
        },
        {
          namespace: 'test-namespace2',
          status: { used: { 'limits.cpu': 1 }, hard: { 'limits.cpu': 2 } },
        },
      ],
      total: { hard: { 'limits.cpu': 2 }, used: { 'limits.cpu': 1 } },
    },
  };

  beforeEach(() => {
    wrapper = shallow(
      <ResourceUsageRow resourceType={'limits.cpu'} quota={quota} namespace="test-namespace" />,
    );
  });

  it('renders ResourceUsageRow for each columns', () => {
    const col0 = wrapper.childAt(0);
    expect(col0.text()).toBe('limits.cpu');

    const col1 = wrapper.childAt(1);
    expect(col1.find('.co-resource-quota-icon').exists()).toBe(true);

    const col2 = wrapper.childAt(2);
    expect(col2.text()).toBe('0');

    const col3 = wrapper.childAt(3);
    expect(col3.text()).toBe('1');

    const col4 = wrapper.childAt(4);
    expect(col4.text()).toBe('2');
  });
});
