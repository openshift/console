import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverlayProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { k8sPatch } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import { useToast } from '@console/shared/src/components/toast/useToast';
import { consolePlugin } from '@console/shared/src/test-utils/console-plugin';
import type { ConsolePluginTableRow } from '../ConsolePluginsTable';
import { useConsolePluginBulkActions } from '../useConsolePluginBulkActions';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s'),
  k8sPatch: jest.fn(),
}));
jest.mock('@console/shared/src/components/toast/useToast', () => ({
  useToast: jest.fn(),
}));

describe('useConsolePluginBulkActions', () => {
  const onComplete = jest.fn();
  const addToast = jest.fn();
  const consoleOperatorConfig = {
    metadata: { name: 'cluster' },
    spec: { plugins: ['existing-plugin'] },
  };
  const userTokenPlugin: ConsolePluginTableRow = {
    name: 'test-plugin',
    enabled: false,
    status: undefined,
    proxies: consolePlugin.spec.proxy,
  };
  const publicPlugin: ConsolePluginTableRow = {
    name: 'public-plugin',
    enabled: false,
    status: undefined,
    proxies: [consolePlugin.spec.proxy[1]],
  };
  const existingPlugin: ConsolePluginTableRow = {
    ...userTokenPlugin,
    name: 'existing-plugin',
    enabled: true,
  };
  const BulkActions = ({ selectedPlugins }: { selectedPlugins: ConsolePluginTableRow[] }) => {
    const getActions = useConsolePluginBulkActions(consoleOperatorConfig);
    return (
      <>
        {getActions(selectedPlugins, onComplete).map((action) => (
          <button
            type="button"
            key={action.id}
            disabled={action.disabled}
            onClick={() => {
              if (typeof action.cta === 'function') action.cta();
            }}
          >
            {action.label}
          </button>
        ))}
      </>
    );
  };
  const renderActions = (selectedPlugins: ConsolePluginTableRow[]) =>
    render(
      <OverlayProvider>
        <BulkActions selectedPlugins={selectedPlugins} />
      </OverlayProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(k8sPatch).mockResolvedValue(consoleOperatorConfig);
    jest.mocked(useToast).mockReturnValue({
      addToast,
      removeToast: jest.fn(),
      minimizeToast: jest.fn(),
    });
  });

  it('should confirm affected plugins before applying the existing mixed-selection patch', async () => {
    const user = userEvent.setup();
    renderActions([userTokenPlugin, publicPlugin, existingPlugin]);
    await user.click(screen.getByRole('button', { name: 'Enable' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('test-plugin')).toBeVisible();
    expect(within(dialog).queryByText('public-plugin')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('existing-plugin')).not.toBeInTheDocument();
    expect(k8sPatch).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Enable' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(k8sPatch).toHaveBeenCalledWith(ConsoleOperatorConfigModel, consoleOperatorConfig, [
      { op: 'test', path: '/spec/plugins', value: ['existing-plugin'] },
      {
        op: 'replace',
        path: '/spec/plugins',
        value: ['existing-plugin', 'test-plugin', 'public-plugin'],
      },
    ]);
  });

  it('should cancel UserToken enablement without patching or completing the action', async () => {
    const user = userEvent.setup();
    renderActions([userTokenPlugin]);
    await user.click(screen.getByRole('button', { name: 'Enable' }));

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(k8sPatch).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should enable None proxies directly and ignore already enabled UserToken plugins', async () => {
    const user = userEvent.setup();
    renderActions([publicPlugin, existingPlugin]);

    await user.click(screen.getByRole('button', { name: 'Enable' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(k8sPatch).toHaveBeenCalledWith(ConsoleOperatorConfigModel, consoleOperatorConfig, [
      { op: 'test', path: '/spec/plugins', value: ['existing-plugin'] },
      { op: 'replace', path: '/spec/plugins', value: ['existing-plugin', 'public-plugin'] },
    ]);
  });

  it('should preserve the error toast when confirmed enablement fails', async () => {
    jest.mocked(k8sPatch).mockRejectedValue(new Error('Forbidden'));
    const user = userEvent.setup();
    renderActions([userTokenPlugin]);
    await user.click(screen.getByRole('button', { name: 'Enable' }));

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Enable' }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        variant: 'danger',
        title: 'Failed to enable plugins',
        content: 'Forbidden',
      }),
    );
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should disable UserToken plugins without requiring enablement confirmation', async () => {
    const user = userEvent.setup();
    renderActions([existingPlugin]);

    await user.click(screen.getByRole('button', { name: 'Disable' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(k8sPatch).toHaveBeenCalledWith(ConsoleOperatorConfigModel, consoleOperatorConfig, [
      { op: 'test', path: '/spec/plugins', value: ['existing-plugin'] },
      { op: 'replace', path: '/spec/plugins', value: [] },
    ]);
  });
});
