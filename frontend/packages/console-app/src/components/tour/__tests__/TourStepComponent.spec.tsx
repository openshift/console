import { screen, configure } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import TourStepComponent from '../TourStepComponent';

describe('TourStepComponent', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });
  it('should render Modal if no selector is present', () => {
    renderWithProviders(<TourStepComponent heading="heading" content="content" />);
    // Semantic queries: Role → Text priority
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(modal).toBeVisible();
    // Verify content accessibility
    expect(screen.getByText('heading')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('should render Popover with Spotlight when selector is present', () => {
    renderWithProviders(
      <TourStepComponent heading="heading" content="content" selector="a" step={1} />,
    );
    // User behavior: Modal should not be rendered when selector is provided
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Content should still be accessible
    expect(screen.getByText('heading')).toBeVisible();
    expect(screen.getByText('content')).toBeVisible();
  });
});
