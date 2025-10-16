import { render, screen } from '@testing-library/react';
import { sampleKnativeConfigurations } from '../../../topology/__tests__/topology-knative-test-data';
import ConfigurationsOverviewList from '../ConfigurationsOverviewList';

jest.mock('../ConfigurationsOverviewListItem', () => ({
  __esModule: true,
  default: 'ConfigurationsOverviewListItem',
}));

describe('ConfigurationsOverviewList', () => {
  it('should render error Message when configurations array is empty', () => {
    render(<ConfigurationsOverviewList configurations={[]} />);
    expect(screen.getByText('No configurations found for this resource.')).toBeInTheDocument();
  });

  it('should render ConfigurationsOverviewListItem', () => {
    const { container } = render(
      <ConfigurationsOverviewList configurations={sampleKnativeConfigurations.data} />,
    );
    expect(container.querySelector('ConfigurationsOverviewListItem')).toBeInTheDocument();
  });
});
