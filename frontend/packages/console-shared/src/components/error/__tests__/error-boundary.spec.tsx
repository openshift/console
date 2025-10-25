import { screen } from '@testing-library/react';
import { ErrorBoundary, withFallback } from '..';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';

const Child = () => <span>Child</span>;
const ProblemChild = () => {
  throw new Error('Test error');
};
const FallbackComponent = () => <p>Custom Fallback</p>;

describe('ErrorBoundary', () => {
  beforeAll(() => {
    // Suppress console errors during while running the tests since they're expected when testing error boundaries
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should render its child components when there is no error', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Child')).toBeVisible();
    expect(screen.queryByText('Custom Fallback')).not.toBeInTheDocument();
  });

  it('should render the custom FallbackComponent when an error is caught', () => {
    renderWithProviders(
      <ErrorBoundary FallbackComponent={FallbackComponent}>
        <ProblemChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom Fallback')).toBeVisible();
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('should render the default fallback when an error is caught and no fallback is provided', () => {
    const { container } = renderWithProviders(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );

    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild?.textContent).toBe('');
  });
});

describe('withFallback HOC', () => {
  beforeAll(() => {
    // Suppress console errors during tests since they're expected when testing error boundaries
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should wrap the given component and render it normally when there is no error', () => {
    const WrappedComponent = withFallback(Child);
    renderWithProviders(<WrappedComponent />);

    expect(screen.getByText('Child')).toBeVisible();
  });

  it('should render the default fallback when the wrapped component throws an error', () => {
    const WrappedComponent = withFallback(ProblemChild);
    const { container } = renderWithProviders(<WrappedComponent />);

    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild?.textContent).toBe('');
  });

  it('should render the custom fallback when the wrapped component throws an error', () => {
    const WrappedComponent = withFallback(ProblemChild, FallbackComponent);
    renderWithProviders(<WrappedComponent />);

    expect(screen.getByText('Custom Fallback')).toBeVisible();
  });
});
