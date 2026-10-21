import { screen, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { AsyncComponent } from '../../../components/utils/async';

// Mock LoadingBox component
jest.mock('../../../components/utils/status-box', () => ({
  LoadingBox: () => 'Loading...',
}));

describe('AsyncComponent', () => {
  // Mock components to be loaded
  const Foo = (props: { className?: string }) => (
    <div className={props.className}>Foo Component</div>
  );
  const Bar = (props: { className?: string }) => (
    <div className={props.className}>Bar Component</div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the given loader function', async () => {
    const loader = jest.fn(() => Promise.resolve(Foo));
    renderWithProviders(<AsyncComponent loader={loader} />);
    await waitFor(() => {
      expect(loader).toHaveBeenCalled();
    });
  });

  it('renders LoadingBox before loader promise resolves', () => {
    // Create a promise that never resolves to keep the component in a loading state
    const loader = () => new Promise<typeof Foo>(() => {});
    renderWithProviders(<AsyncComponent loader={loader} />);

    expect(screen.getByText('Loading...')).toBeVisible();
  });

  it('renders error boundary fallback when loader promise is rejected after retries', async () => {
    jest.useFakeTimers();
    // Suppress console.error for expected React error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const loader = jest.fn(() => Promise.reject(new Error('epic fail')));

    // @ts-expect-error Testing rejection case
    renderWithProviders(<AsyncComponent loader={loader} />);

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeVisible();

    // Fast-forward through all 26 attempts (initial + 25 retries)
    // Each iteration needs to flush promises and advance timers
    for (let i = 0; i < 26; i++) {
      await act(async () => {
        jest.advanceTimersByTime(30000); // Advance past any backoff delay
      });
    }

    // After all retries exhausted, the error boundary catches the error
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('epic fail')).toBeInTheDocument();
      expect(screen.getByTestId('error-reload-page')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
    jest.useRealTimers();
  });

  it('attempts to resolve the loader promise again after rejection with a backoff delay', async () => {
    jest.useFakeTimers();
    // Suppress console.error for expected React error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const loader = jest.fn(() => Promise.reject(new Error('fail')));
    // @ts-expect-error Testing rejection case
    renderWithProviders(<AsyncComponent loader={loader} />);

    // First attempt happens immediately
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    // After 100ms (first backoff delay), second attempt
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));

    // After 200ms (second backoff delay), third attempt
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(3));

    consoleSpy.mockRestore();
    jest.useRealTimers();
  });

  it('does not retry if the loader resolves with a null or undefined component', async () => {
    jest.useFakeTimers();
    const loader = jest.fn(() => Promise.resolve(null));
    renderWithProviders(<AsyncComponent loader={loader} />);

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(loader).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('renders component resolved from loader promise', async () => {
    const loader = () => Promise.resolve(Foo);
    renderWithProviders(<AsyncComponent loader={loader} />);

    await waitFor(() => {
      expect(screen.getByText('Foo Component')).toBeVisible();
    });
  });

  it('passes given props to rendered component', async () => {
    const className = 'arbitrary-class-name';
    const loader = () => Promise.resolve(Foo);

    renderWithProviders(<AsyncComponent loader={loader} className={className} />);

    await waitFor(() => {
      const component = screen.getByText('Foo Component');
      expect(component).toBeInTheDocument();
      expect(component).toHaveClass(className);
    });
  });

  it('renders new component if props.loader changes', async () => {
    const loaderFoo = () => Promise.resolve(Foo);
    const loaderBar = () => Promise.resolve(Bar);

    const { rerender } = renderWithProviders(<AsyncComponent loader={loaderFoo} />);

    // Wait for first component to load
    await waitFor(() => {
      expect(screen.getByText('Foo Component')).toBeVisible();
    });

    rerender(<AsyncComponent loader={loaderBar} />);

    // Wait for second component to load
    await waitFor(() => {
      expect(screen.getByText('Bar Component')).toBeVisible();
    });

    // Verify first component is no longer in the document
    expect(screen.queryByText('Foo Component')).not.toBeInTheDocument();
  });
});
