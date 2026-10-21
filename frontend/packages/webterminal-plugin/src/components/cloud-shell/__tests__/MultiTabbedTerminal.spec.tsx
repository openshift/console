import { act, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { sendActivityTick } from '../cloud-shell-utils';
import { MultiTabbedTerminal } from '../MultiTabbedTerminal';

jest.mock('../cloud-shell-utils', () => {
  return {
    sendActivityTick: jest.fn(),
  };
});

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/CloudShellTerminal', () => ({
  default: () => 'Terminal content',
}));

const originalWindowRequestAnimationFrame = window.requestAnimationFrame;
const originalWindowCancelAnimationFrame = window.cancelAnimationFrame;

// Helper to click an element multiple times sequentially with act()
const clickMultipleTimes = async (element: HTMLElement, times: number) => {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      fireEvent.click(element);
    });
  }
};

describe('MultiTabTerminal', () => {
  jest.useFakeTimers();
  (sendActivityTick as jest.Mock).mockImplementation((a, b) => [a, b]);

  beforeAll(() => {
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  });

  afterAll(() => {
    window.requestAnimationFrame = originalWindowRequestAnimationFrame;
    window.cancelAnimationFrame = originalWindowCancelAnimationFrame;
  });

  it('should initially load with only one console', async () => {
    let multiTabTerminalWrapper: ReturnType<typeof renderWithProviders>;
    await act(async () => {
      multiTabTerminalWrapper = renderWithProviders(<MultiTabbedTerminal />);
    });

    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(1);
  });

  it('should add terminals on add terminal icon click', async () => {
    let multiTabTerminalWrapper: ReturnType<typeof renderWithProviders>;
    await act(async () => {
      multiTabTerminalWrapper = renderWithProviders(<MultiTabbedTerminal />);
    });

    const addTerminalButton = multiTabTerminalWrapper.getByLabelText('Add new tab');
    await act(async () => {
      fireEvent.click(addTerminalButton);
    });
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(2);
    await act(async () => {
      fireEvent.click(addTerminalButton);
    });
    await act(async () => {
      fireEvent.click(addTerminalButton);
    });
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(4);
  });

  it('should not allow more than 8 terminals', async () => {
    let multiTabTerminalWrapper: ReturnType<typeof renderWithProviders>;
    await act(async () => {
      multiTabTerminalWrapper = renderWithProviders(<MultiTabbedTerminal />);
    });

    const addTerminalButton = multiTabTerminalWrapper.getByLabelText('Add new tab');
    await clickMultipleTimes(addTerminalButton, 8);
    expect(multiTabTerminalWrapper.getAllByText('Terminal content')).toHaveLength(8);
    expect(multiTabTerminalWrapper.queryByLabelText('Add new tab')).toBeNull();
  });

  it('should remove terminals on remove terminal icon click', async () => {
    let multiTabTerminalWrapper: ReturnType<typeof renderWithProviders>;
    await act(async () => {
      multiTabTerminalWrapper = renderWithProviders(<MultiTabbedTerminal />);
    });

    const addTerminalButton = multiTabTerminalWrapper.getByLabelText('Add new tab');
    await clickMultipleTimes(addTerminalButton, 8);

    await act(async () => {
      fireEvent.click(multiTabTerminalWrapper.getAllByLabelText('Close terminal tab').at(7));
    });
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(7);
    await act(async () => {
      fireEvent.click(multiTabTerminalWrapper.getAllByLabelText('Close terminal tab').at(6));
    });
    await act(async () => {
      fireEvent.click(multiTabTerminalWrapper.getAllByLabelText('Close terminal tab').at(5));
    });
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(5);
  });

  jest.clearAllTimers();
});
