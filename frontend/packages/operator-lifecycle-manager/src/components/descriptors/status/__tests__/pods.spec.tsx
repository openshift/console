import { render, screen } from '@testing-library/react';
import type { Descriptor } from '../../types';
import { SpecCapability } from '../../types';
import { PodStatusChart } from '../pods';

describe(PodStatusChart.displayName, () => {
  let descriptor: Descriptor;

  beforeEach(() => {
    descriptor = {
      path: 'size',
      displayName: 'Size',
      description: 'The desired number of member Pods for the etcd cluster.',
      'x-descriptors': [SpecCapability.podCount],
    };
  });

  it('should render donut chart with count and subtitle', () => {
    render(<PodStatusChart subTitle={descriptor.path} statuses={{}} />);

    expect(screen.getByText('0')).toBeVisible();
    expect(screen.getByText(descriptor.path)).toBeVisible();
  });

  it('should display correct total count when statuses are provided', () => {
    const statuses = {
      ready: ['pod-0', 'pod-1'],
      starting: ['pod-2'],
    };
    render(<PodStatusChart subTitle={descriptor.path} statuses={statuses} />);

    // Verify the chart shows the correct total count
    expect(screen.getByText('3')).toBeVisible();
    // Verify subtitle is still rendered
    expect(screen.getByText(descriptor.path)).toBeVisible();
  });
});
