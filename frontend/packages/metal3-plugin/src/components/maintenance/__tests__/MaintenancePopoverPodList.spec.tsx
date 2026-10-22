import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import MaintenancePopoverPodList from '../MaintenancePopoverPodList';

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: jest.fn(({ name }) => name),
}));

describe('MaintenancePopoverPodList', () => {
  it('should list every pending pod', () => {
    renderWithProviders(<MaintenancePopoverPodList pods={['pod-a', 'pod-b', 'pod-c']} />);

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'pod-a',
      'pod-b',
      'pod-c',
    ]);
  });

  it('should list every pod past the point the list starts scrolling', () => {
    const pods = Array.from({ length: 12 }, (_, i) => `pod-${i}`);
    renderWithProviders(<MaintenancePopoverPodList pods={pods} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    expect(screen.getByText('pod-11')).toBeVisible();
  });

  it('should render an empty list when no pods are pending', () => {
    renderWithProviders(<MaintenancePopoverPodList pods={[]} />);

    expect(screen.getByRole('list')).toBeEmptyDOMElement();
  });
});
