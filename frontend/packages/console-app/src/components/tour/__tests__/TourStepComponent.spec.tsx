import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import TourStepComponent from '../TourStepComponent';

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  Popover: () => 'POPOVER_RENDERED',
  Spotlight: () => 'SPOTLIGHT_RENDERED',
}));

describe('TourStepComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Modal if no selector is present', () => {
    renderWithProviders(<TourStepComponent heading="Tour Heading" content="Tour Content" />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tour Heading')).toBeVisible();
    expect(screen.getByText('Tour Content')).toBeVisible();

    // Verify Popover and Spotlight are NOT rendered
    expect(screen.queryByText(/POPOVER_RENDERED/)).not.toBeInTheDocument();
    expect(screen.queryByText(/SPOTLIGHT_RENDERED/)).not.toBeInTheDocument();
  });

  it('should render Popover with Spotlight when selector is present', () => {
    renderWithProviders(
      <TourStepComponent heading="Tour Heading" content="Tour Content" selector="a" step={1} />,
    );

    expect(screen.getByText(/POPOVER_RENDERED/)).toBeVisible();
    expect(screen.getByText(/SPOTLIGHT_RENDERED/)).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
