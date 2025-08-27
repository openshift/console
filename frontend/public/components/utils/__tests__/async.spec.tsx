import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { AsyncComponent } from '../../../components/utils/async';

describe('AsyncComponent', () => {
  const fooId = 'fooId';
  const Foo = (props: { className: string }) => (
    <div data-testid={fooId} className={props.className} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls given loader function', async () => {
    const loader = jest.fn(() => Promise.resolve(Foo));

    render(<AsyncComponent loader={loader} />);

    await waitFor(() => {
      expect(loader).toHaveBeenCalled();
    });
  });

  it('renders `LoadingBox` before `loader` promise resolves', async () => {
    const loader = () => new Promise<typeof Foo>(() => {});

    render(<AsyncComponent loader={loader} />);

    expect(screen.getByTestId('loading-box')).toBeInTheDocument();
  });

  it('continues to display `LoadingBox` if `loader` promise is rejected', async () => {
    const loader = () => Promise.reject('epic fail');

    render(<AsyncComponent loader={loader} />);

    // LoadingBox should be displayed initially
    expect(screen.getByTestId('loading-box')).toBeInTheDocument();

    // Wait a bit to allow retry logic to run
    await new Promise((resolve) => setTimeout(resolve, 150));

    // LoadingBox should still be displayed after rejection
    expect(screen.getByTestId('loading-box')).toBeInTheDocument();
  });

  it('attempts to resolve `loader` promise again if rejected after waiting 100 * n^2 milliseconds (n = retry count)', async () => {
    jest.useFakeTimers();
    const end = 1000;

    const loader = jest.fn(() => Promise.reject(null));

    render(<AsyncComponent loader={loader} />);

    // Fast-forward time to trigger retries
    jest.advanceTimersByTime(end);

    // Allow any pending promises to resolve
    await Promise.resolve();

    expect(loader).toHaveBeenCalledTimes(Math.floor(Math.sqrt(end / 100)));

    jest.useRealTimers();
  });

  it('does not attempt to resolve `loader` promise again if it resolves an undefined component', async () => {
    const loader = jest.fn(() => Promise.resolve(null));

    render(<AsyncComponent loader={loader} />);

    // Wait for initial call and potential retries
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('renders component resolved from `loader` promise', async () => {
    const loader = () => Promise.resolve(Foo);

    render(<AsyncComponent loader={loader} />);

    await waitFor(() => {
      expect(screen.getByTestId(fooId)).toBeInTheDocument();
    });
  });

  it('passes given props to rendered component', async () => {
    const className = 'arbitrary-class-name';
    const loader = () => Promise.resolve(Foo);

    render(<AsyncComponent loader={loader} className={className} />);

    await waitFor(() => {
      const component = screen.getByTestId(fooId);
      expect(component).toBeInTheDocument();
      expect(component).toHaveClass(className);
    });
  });

  it('renders new component if `props.loader` changes', async () => {
    const barId = 'barId';
    const Bar = (props: { className: string }) => (
      <div data-testid={barId} className={props.className} />
    );

    const loader1 = () => Promise.resolve(Foo);
    const loader2 = () => Promise.resolve(Bar);

    const { rerender } = render(<AsyncComponent loader={loader1} />);

    // Wait for first component to load
    await waitFor(() => {
      expect(screen.getByTestId(fooId)).toBeInTheDocument();
    });

    // Change the loader
    rerender(<AsyncComponent loader={loader2} />);

    // Wait for second component to load
    await waitFor(() => {
      expect(screen.getByTestId(barId)).toBeInTheDocument();
    });

    // Verify first component is no longer in the document
    expect(screen.queryByTestId(fooId)).not.toBeInTheDocument();
  });
});
