import { screen } from '@testing-library/react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { GettingStartedSection } from '../GettingStartedSection';

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

jest.mock('../SamplesGettingStartedCard', () => ({
  SampleGettingStartedCard: () => 'Samples card',
}));

jest.mock('../QuickStartGettingStartedCard', () => ({
  QuickStartGettingStartedCard: () => 'Quick starts card',
}));

jest.mock('../FunctionsDocsGettingStartedCard', () => ({
  FunctionsDocsGettingStartedCard: () => 'Docs card',
}));

const useUserPreferenceMock = useUserPreference as jest.Mock;

describe('GettingStartedSection', () => {
  beforeEach(() => {
    useUserPreferenceMock.mockReset();
  });

  it('should not render until the expansion preference has loaded', () => {
    useUserPreferenceMock.mockReturnValue([undefined, jest.fn(), false]);

    renderWithProviders(<GettingStartedSection />);

    expect(screen.queryByTestId('getting-started')).not.toBeInTheDocument();
  });

  it('should render collapsed when a saved false preference loads after mount', () => {
    useUserPreferenceMock.mockReturnValue([undefined, jest.fn(), false]);
    const { rerender } = renderWithProviders(<GettingStartedSection />);
    expect(screen.queryByTestId('getting-started')).not.toBeInTheDocument();

    // The preference store loads asynchronously; the saved collapsed state
    // must be applied before the uncontrolled expansion state initializes.
    useUserPreferenceMock.mockReturnValue([false, jest.fn(), true]);
    rerender(<GettingStartedSection />);

    expect(screen.getByTestId('getting-started')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('should follow the preference when its value changes after mount', () => {
    useUserPreferenceMock.mockReturnValue([true, jest.fn(), true]);
    const { rerender } = renderWithProviders(<GettingStartedSection />);
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // E.g. useUserPreference reverting a failed write: the uncontrolled
    // expansion state must be re-initialized from the new value.
    useUserPreferenceMock.mockReturnValue([false, jest.fn(), true]);
    rerender(<GettingStartedSection />);

    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
