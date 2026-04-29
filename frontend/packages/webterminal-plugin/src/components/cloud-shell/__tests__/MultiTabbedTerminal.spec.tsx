import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Helper to click an element multiple times sequentially
const clickMultipleTimes = async (
  user: ReturnType<typeof userEvent.setup>,
  getElement: () => HTMLElement | null,
  times: number,
) => {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line no-await-in-loop
    const element = getElement();
    if (!element) break; // Stop if element disappears
    // eslint-disable-next-line no-await-in-loop
    await user.click(element);
  }
};

describe('MultiTabTerminal', () => {
  jest.useFakeTimers();
  let user: ReturnType<typeof userEvent.setup>;
  (sendActivityTick as jest.Mock).mockImplementation((a, b) => [a, b]);

  beforeEach(() => {
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  });

  beforeAll(() => {
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  });

  afterAll(() => {
    window.requestAnimationFrame = originalWindowRequestAnimationFrame;
    window.cancelAnimationFrame = originalWindowCancelAnimationFrame;
  });

  it('should initially load with only one console', () => {
    renderWithProviders(<MultiTabbedTerminal />);

    expect(screen.getAllByText('Terminal content').length).toBe(1);
  });

  it('should add terminals on add terminal icon click', async () => {
    renderWithProviders(<MultiTabbedTerminal />);

    const addTerminalButton = screen.getByLabelText('Add new tab');
    await user.click(addTerminalButton);
    expect(screen.getAllByText('Terminal content').length).toBe(2);
    await user.click(addTerminalButton);
    await user.click(addTerminalButton);
    expect(screen.getAllByText('Terminal content').length).toBe(4);
  });

  it('should not allow more than 8 terminals', async () => {
    renderWithProviders(<MultiTabbedTerminal />);

    await clickMultipleTimes(user, () => screen.queryByLabelText('Add new tab'), 8);
    expect(screen.getAllByText('Terminal content')).toHaveLength(8);
    expect(screen.queryByLabelText('Add new tab')).toBeNull();
  });

  it('should remove terminals on remove terminal icon click', async () => {
    renderWithProviders(<MultiTabbedTerminal />);

    await clickMultipleTimes(user, () => screen.queryByLabelText('Add new tab'), 8);

    const closeTerminalTabs = () => screen.getAllByLabelText('Close terminal tab');
    const tabs = closeTerminalTabs();
    expect(tabs[7]).toBeTruthy();
    await user.click(tabs[7]);
    expect(screen.getAllByText('Terminal content').length).toBe(7);

    const tabs2 = closeTerminalTabs();
    expect(tabs2[6]).toBeTruthy();
    await user.click(tabs2[6]);

    const tabs3 = closeTerminalTabs();
    expect(tabs3[5]).toBeTruthy();
    await user.click(tabs3[5]);
    expect(screen.getAllByText('Terminal content').length).toBe(5);
  });

  jest.clearAllTimers();
});
