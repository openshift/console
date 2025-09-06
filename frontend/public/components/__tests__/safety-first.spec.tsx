import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useSafetyFirst } from '@console/dynamic-plugin-sdk';

type Props = {
  loader: () => Promise<any>;
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
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        // Unmount the component by rerendering without it
        resolve();
      });

    const { rerender } = render(<Unsafe loader={loader} />);

    fireEvent.click(screen.getByRole('button'));

    // Unmount by rerendering empty
    rerender(<div />);

    await waitFor(() => {
      expect(
        consoleErrorSpy.mock.calls
          .map((call) => call[0] as string)
          .some((text) => text.includes(warning)),
      ).toBe(true);
    });

    consoleErrorSpy.mockRestore();
  });
});

describe('useSafetyFirst', () => {
  let consoleErrorSpy: jest.SpyInstance;

  const Safe: React.FCC<Props> = (props) => {
    const [inFlight, setInFlight] = useSafetyFirst(true);

    const onClick = () => props.loader().then(() => setInFlight(false));

    return <button onClick={onClick}>Load{inFlight ? 'ing...' : 'ed'}</button>;
  };

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('does not attempt to set React state if unmounted (using hook)', async () => {
    const loader = () =>
      new Promise<void>((resolve) => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        resolve();
      });

    const { rerender } = render(<Safe loader={loader} />);

    fireEvent.click(screen.getByRole('button'));

    // Unmount the component
    rerender(<div />);

    await waitFor(() => {
      expect(
        consoleErrorSpy.mock.calls
          .map((call) => call[0] as string)
          .some((text) => text.includes(warning)),
      ).toBe(false);
    });
  });

  it('will set React state if mounted (using hook)', async () => {
    const loader = () =>
      new Promise<void>((resolve) => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        resolve();
      });

    render(<Safe loader={loader} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
      expect(
        consoleErrorSpy.mock.calls
          .map((call) => call[0] as string)
          .some((text) => text.includes(warning)),
      ).toBe(false);
    });
  });
});
