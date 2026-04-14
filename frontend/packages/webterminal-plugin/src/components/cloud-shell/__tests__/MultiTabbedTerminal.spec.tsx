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

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/DetachedPodExec', () => ({
  default: ({ sessionId }: { sessionId: string }) => `Detached ${sessionId}`,
}));

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: () => true,
}));

const mockCleanup = jest.fn();
jest.mock('@console/internal/module/detached-ws-registry', () => ({
  cleanupDetachedResource: (...args: unknown[]) => mockCleanup(...args),
}));

const mockUseDetachedSessions = jest.fn();
jest.mock('@console/webterminal-plugin/src/redux/reducers/cloud-shell-selectors', () => {
  const actual = jest.requireActual(
    '@console/webterminal-plugin/src/redux/reducers/cloud-shell-selectors',
  );
  return {
    ...actual,
    useDetachedSessions: () => mockUseDetachedSessions(),
  };
});

const originalWindowRequestAnimationFrame = window.requestAnimationFrame;
const originalWindowCancelAnimationFrame = window.cancelAnimationFrame;

const clickMultipleTimes = async (
  user: ReturnType<typeof userEvent.setup>,
  getElement: () => HTMLElement | null,
  times: number,
) => {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line no-await-in-loop
    const element = getElement();
    if (!element) break;
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

  beforeEach(() => {
    mockUseDetachedSessions.mockReturnValue([]);
    mockCleanup.mockClear();
  });

  it('should initially load with only one console', () => {
    const multiTabTerminalWrapper = renderWithProviders(<MultiTabbedTerminal />);

    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(1);
  });

  it('should add terminals on add terminal icon click', async () => {
    const multiTabTerminalWrapper = renderWithProviders(<MultiTabbedTerminal />);

    const addTerminalButton = multiTabTerminalWrapper.getByLabelText('Add new tab');
    await user.click(addTerminalButton);
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(2);
    await user.click(addTerminalButton);
    await user.click(addTerminalButton);
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(4);
  });

  it('should not allow more than 8 terminals', async () => {
    const multiTabTerminalWrapper = renderWithProviders(<MultiTabbedTerminal />);

    await clickMultipleTimes(
      user,
      () => multiTabTerminalWrapper.queryByLabelText('Add new tab'),
      8,
    );
    expect(multiTabTerminalWrapper.getAllByText('Terminal content')).toHaveLength(8);
    expect(multiTabTerminalWrapper.queryByLabelText('Add new tab')).toBeNull();
  });

  it('should remove terminals on remove terminal icon click', async () => {
    const multiTabTerminalWrapper = renderWithProviders(<MultiTabbedTerminal />);

    await clickMultipleTimes(
      user,
      () => multiTabTerminalWrapper.queryByLabelText('Add new tab'),
      8,
    );

    const closeTerminalTabs = () => multiTabTerminalWrapper.getAllByLabelText('Close terminal tab');
    const tabs = closeTerminalTabs();
    expect(tabs[7]).toBeTruthy();
    await user.click(tabs[7]);
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(7);

    const tabs2 = closeTerminalTabs();
    expect(tabs2[6]).toBeTruthy();
    await user.click(tabs2[6]);

    const tabs3 = closeTerminalTabs();
    expect(tabs3[5]).toBeTruthy();
    await user.click(tabs3[5]);
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(5);
  });

  describe('detached session tabs', () => {
    const detachedSessions = [
      {
        id: 'pod1-c1',
        podName: 'my-pod',
        namespace: 'ns-1',
        containerName: 'main',
        cleanup: { type: 'namespace' as const, name: 'openshift-debug-abc' },
      },
      {
        id: 'pod2-c2',
        podName: 'other-pod',
        namespace: 'ns-2',
        containerName: 'sidecar',
      },
    ];

    it('should render detached sessions as additional tabs', () => {
      mockUseDetachedSessions.mockReturnValue(detachedSessions);
      const wrapper = renderWithProviders(<MultiTabbedTerminal />);

      expect(wrapper.getByText('Detached pod1-c1')).toBeTruthy();
      expect(wrapper.getByText('Detached pod2-c2')).toBeTruthy();
    });

    it('should include detached sessions in total tab count', () => {
      mockUseDetachedSessions.mockReturnValue(detachedSessions);
      const wrapper = renderWithProviders(<MultiTabbedTerminal />);

      // 1 Cloud Shell tab + 2 detached = 3 total
      const closeBtns = wrapper.getAllByLabelText('Close terminal tab');
      expect(closeBtns).toHaveLength(3);
    });

    it('should call cleanupDetachedResource when closing a detached tab with cleanup metadata', async () => {
      mockUseDetachedSessions.mockReturnValue(detachedSessions);
      const wrapper = renderWithProviders(<MultiTabbedTerminal />);

      const closeBtns = wrapper.getAllByLabelText('Close terminal tab');
      // Index 0 = Cloud Shell tab, Index 1 = first detached, Index 2 = second detached
      await user.click(closeBtns[1]);

      expect(mockCleanup).toHaveBeenCalledWith(detachedSessions[0].cleanup);
    });
  });

  jest.clearAllTimers();
});
