import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  PromiseComponent,
  PromiseComponentState,
} from '../../../components/utils/promise-component';

describe('PromiseComponent', () => {
  class TestComponent extends PromiseComponent<
    { promise: Promise<string> },
    PromiseComponentState
  > {
    handleClick = () => {
      this.handlePromise(this.props.promise).catch(() => {});
    };

    render() {
      return this.state.inProgress ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        <button onClick={this.handleClick}>Click me</button>
      );
    }
  }

  it('toggles loading state when handling promises', async () => {
    let resolvePromise: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });

    render(<TestComponent promise={promise} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();

    // Click button to trigger promise handling
    fireEvent.click(screen.getByRole('button'));

    // Should show loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    // Resolve promise
    resolvePromise!('Success');

    // Should return to button state
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('handles promise rejection', async () => {
    let rejectPromise: (error: Error) => void;
    const promise = new Promise<string>((_, reject) => {
      rejectPromise = reject;
    });

    render(<TestComponent promise={promise} />);

    // Click to trigger handlePromise - catch the rejection
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Reject the promise and catch the error from handlePromise
    rejectPromise!(new Error('Test error'));

    // Wait for the state update
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // Loading should be gone
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
});
