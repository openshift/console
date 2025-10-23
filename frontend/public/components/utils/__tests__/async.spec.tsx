import { render, screen, waitFor } from '@testing-library/react';

import { AsyncComponent } from '../../../components/utils/async';

// Mock LoadingBox component
jest.mock('../../../components/utils/status-box', () => ({
  LoadingBox: () => 'Loading...',
}));

describe('AsyncComponent', () => {
  // Mock components to be loaded
  const Foo = (props: { className: string }) => (
    <div className={props.className}>Foo Component</div>
  );
  const Bar = (props: { className: string }) => (
    <div className={props.className}>Bar Component</div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the given loader function', async () => {
    const loader = jest.fn(() => Promise.resolve(Foo));
    render(<AsyncComponent loader={loader} />);
    await waitFor(() => {
      expect(loader).toHaveBeenCalled();
    });
  });

  it('renders LoadingBox before loader promise resolves', () => {
    // Create a promise that never resolves to keep the component in a loading state
    const loader = () => new Promise<typeof Foo>(() => {});
    render(<AsyncComponent loader={loader} />);

    expect(screen.getByText('Loading...')).toBeVisible();
  });

  it('continues to display LoadingBox if loader promise is rejected', async () => {
    const loader = () => Promise.reject('epic fail');
    render(<AsyncComponent loader={loader} />);

    expect(screen.getByText('Loading...')).toBeVisible();

    // Wait a bit to allow retry logic to run
    await new Promise((resolve) => setTimeout(resolve, 150));

    // LoadingBox should still be displayed after rejection
    expect(screen.getByText('Loading...')).toBeVisible();
  });

  it('attempts to resolve the loader promise again after rejection with a backoff delay', async () => {
    const loader = jest.fn(() => Promise.reject(null));
    render(<AsyncComponent loader={loader} />);

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(loader).toHaveBeenCalledTimes(2);

    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(loader).toHaveBeenCalledTimes(3);
  });

  it('does not retry if the loader resolves with a null or undefined component', async () => {
    jest.useFakeTimers();
    const loader = jest.fn(() => Promise.resolve(null));
    render(<AsyncComponent loader={loader} />);

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    jest.advanceTimersByTime(1000);

    expect(loader).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('renders component resolved from loader promise', async () => {
    const loader = () => Promise.resolve(Foo);
    render(<AsyncComponent loader={loader} />);

    await waitFor(() => {
      expect(screen.getByText('Foo Component')).toBeVisible();
    });
  });

  it('passes given props to rendered component', async () => {
    const className = 'arbitrary-class-name';
    const loader = () => Promise.resolve(Foo);

    render(<AsyncComponent loader={loader} className={className} />);

    await waitFor(() => {
      const component = screen.getByText('Foo Component');
      expect(component).toBeInTheDocument();
      expect(component).toHaveClass(className);
    });
  });

  it('renders new component if props.loader changes', async () => {
    const loaderFoo = () => Promise.resolve(Foo);
    const loaderBar = () => Promise.resolve(Bar);

    const { rerender } = render(<AsyncComponent loader={loaderFoo} />);

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
