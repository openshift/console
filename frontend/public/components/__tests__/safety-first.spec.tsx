import * as React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { useSafetyFirst } from '@console/dynamic-plugin-sdk';

type Props = {
  loader: () => Promise<void>;
};

const warning = 'perform a React state update on an unmounted component.';

describe('When calling setter from `useState()` hook in an unsafe React component', () => {
  const Unsafe: React.FCC<Props> = (props) => {
    const [inFlight, setInFlight] = React.useState(true);

    const onClick = () => props.loader().then(() => setInFlight(false));

    return <button onClick={onClick}>Load{inFlight ? 'ing...' : 'ed'}</button>;
  };

  it('throws warning when updating state after unmounting', async () => {
    const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {});

    const loader = () =>
      new Promise<void>((resolve) => {
        // Verify loading state is displayed
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        resolve();
      });

    const { rerender } = renderWithProviders(<Unsafe loader={loader} />);

    // Click the button to trigger the async operation
    fireEvent.click(screen.getByRole('button', { name: /loading/i }));

    // Unmount the component by rerendering with different content
    rerender(<div data-test="unmounted" />);

    // Wait for the async operation to complete and check for warning
    await waitFor(() => {
      expect(
        consoleErrorSpy.mock.calls
          .map((call) => call[0] as string)
          .some((text) => text.includes(warning)),
      ).toBe(true);
    });

    jest.restoreAllMocks();
  });
});

describe('useSafetyFirst hook', () => {
  const Safe: React.FCC<Props> = (props) => {
    const [inFlight, setInFlight] = useSafetyFirst(true);

    const onClick = () => props.loader().then(() => setInFlight(false));

    return <button onClick={onClick}>Load{inFlight ? 'ing...' : 'ed'}</button>;
  };

  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not attempt to set React state if unmounted (using hook)', async () => {
    const loader = () =>
      new Promise<void>((resolve) => {
        // Verify loading state is displayed
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        resolve();
      });

    const { rerender } = renderWithProviders(<Safe loader={loader} />);

    fireEvent.click(screen.getByRole('button', { name: /loading/i }));

    // Unmount the component by rerendering with different content
    rerender(<div data-test="unmounted" />);

    // Wait and verify no warning was logged
    await waitFor(() => {
      expect(
        consoleErrorSpy.mock.calls
          .map((call) => call[0] as string)
          .some((text) => text.includes(warning)),
      ).toBe(false);
    });
  });

  it('will set React state if component remains mounted (using hook)', async () => {
    const loader = () =>
      new Promise<void>((resolve) => {
        // Verify loading state is displayed
        expect(screen.getByText('Loading...')).toBeVisible();
        resolve();
      });

    renderWithProviders(<Safe loader={loader} />);

    fireEvent.click(screen.getByRole('button', { name: /loading/i }));
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeVisible();
    });

    // Verify no warning was logged
    expect(
      consoleErrorSpy.mock.calls
        .map((call) => call[0] as string)
        .some((text) => text.includes(warning)),
    ).toBe(false);
  });

  it('displays initial loading state correctly', () => {
    const mockLoader = jest.fn(() => Promise.resolve());

    renderWithProviders(<Safe loader={mockLoader} />);

    // User should see the initial loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
  });

  it('handles multiple rapid clicks gracefully', async () => {
    let resolveCount = 0;
    const loader = () =>
      new Promise<void>((resolve) => {
        resolveCount++;
        setTimeout(resolve, 50);
      });

    renderWithProviders(<Safe loader={loader} />);

    const button = screen.getByRole('button', { name: /loading/i });

    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });

    // Verify the loader was called for each click
    expect(resolveCount).toBe(3);

    // Verify no warnings occurred
    expect(
      consoleErrorSpy.mock.calls
        .map((call) => call[0] as string)
        .some((text) => text.includes(warning)),
    ).toBe(false);
  });
});
