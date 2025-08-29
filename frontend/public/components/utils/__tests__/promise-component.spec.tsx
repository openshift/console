import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  PromiseComponent,
  PromiseComponentState,
} from '../../../components/utils/promise-component';

describe(PromiseComponent.name, () => {
  class Test extends PromiseComponent<{ promise: Promise<number> }, PromiseComponentState> {
    render() {
      return this.state.inProgress ? (
        <div>Loading...</div>
      ) : (
        <button onClick={() => this.handlePromise(this.props.promise)}>
          What is the meaning of life?
        </button>
      );
    }
  }

  it('sets `inProgress` to true before resolving promise', async () => {
    let resolvePromise: (value: number) => void;
    const promise = new Promise<number>((resolve) => {
      resolvePromise = resolve;
    });

    const { rerender } = render(<Test promise={null} />);

    // Initially should show the button
    expect(
      screen.getByRole('button', { name: 'What is the meaning of life?' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

    // Update props with the promise
    rerender(<Test promise={promise} />);

    // Click the button to trigger handlePromise
    fireEvent.click(screen.getByRole('button', { name: 'What is the meaning of life?' }));

    // Should now show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    // Resolve the promise
    resolvePromise!(42);

    // Wait for the component to update and return to button state
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'What is the meaning of life?' }),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('handles promise rejection correctly', async () => {
    let rejectPromise: (error: Error) => void;
    const promise = new Promise<number>((_, reject) => {
      rejectPromise = reject;
    });

    const { rerender } = render(<Test promise={null} />);

    // Initially should show the button
    expect(
      screen.getByRole('button', { name: 'What is the meaning of life?' }),
    ).toBeInTheDocument();

    // Update props with the promise
    rerender(<Test promise={promise} />);

    // Click the button to trigger handlePromise
    fireEvent.click(screen.getByRole('button', { name: 'What is the meaning of life?' }));

    // Should now show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Reject the promise
    rejectPromise!(new Error('Test error'));

    // Wait for the component to update and return to button state
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'What is the meaning of life?' }),
      ).toBeInTheDocument();
    });

    // Should no longer show loading
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
