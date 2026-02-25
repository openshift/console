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

  it('keeps retrying and remains in loading state when loader promise is rejected', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(() => Promise.reject(new Error('epic fail')));

    renderWithProviders(<AsyncComponent loader={loader} />);

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeVisible();

    // Fast-forward through all 26 attempts (initial + 25 retries).
    // In Jest 22, advanceTimersByTime does not flush microtasks, so we use
    // runOnlyPendingTimers (fires regardless of delay) and flush promises
    // manually so the .catch handler runs and schedules the next setTimeout.
    for (let i = 0; i < 26; i++) {
      jest.runOnlyPendingTimers();
      // Flush microtasks so the promise .catch handler runs
      await act(async () => {});
    }

    // The component never gives up — it keeps retrying with a capped backoff,
    // so it stays in the loading state.
    expect(loader).toHaveBeenCalledTimes(26); // 1 initial + 25 retries
    expect(screen.getByText('Loading...')).toBeVisible();

    jest.useRealTimers();
  });

  it('attempts to resolve the loader promise again after rejection with a backoff delay', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(() => Promise.reject(new Error('fail')));
    renderWithProviders(<AsyncComponent loader={loader} />);

    // First attempt happens immediately
    await act(async () => {});
    expect(loader).toHaveBeenCalledTimes(1);

    // After 100ms (first backoff delay: 100 * 1²), second attempt
    jest.advanceTimersByTime(100);
    await act(async () => {});
    expect(loader).toHaveBeenCalledTimes(2);

    // After 400ms (second backoff delay: 100 * 2²), third attempt
    jest.advanceTimersByTime(400);
    await act(async () => {});
    expect(loader).toHaveBeenCalledTimes(3);

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
