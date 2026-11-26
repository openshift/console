import type { ConsolePluginKind } from '@openshift/api-types/dist/openshift/console.openshift.io/v1/ConsolePlugin';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { k8sPatch } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import { consolePlugin } from '../../../test-utils/console-plugin';
import { ConsolePluginModalOverlay } from '../ConsolePluginModal';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));
jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s'),
  k8sPatch: jest.fn(),
}));

describe('ConsolePluginModal', () => {
  const mockWatch = jest.mocked(useK8sWatchResource<ConsolePluginKind>);
  const consoleOperatorConfig = { metadata: { name: 'cluster' }, spec: { plugins: [] } };
  const props = {
    consoleOperatorConfig,
    pluginName: consolePlugin.metadata.name,
    trusted: true,
    closeOverlay: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWatch.mockReturnValue([consolePlugin, true, undefined]);
    jest.mocked(k8sPatch).mockResolvedValue(consoleOperatorConfig);
  });

  it('should fetch configuration and warn before saving enablement of a trusted plugin', async () => {
    const user = userEvent.setup();
    render(<ConsolePluginModalOverlay {...props} />);
    expect(screen.queryByText('Enabling console plugin')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Enable' }));
    expect(screen.getByText('Enabling console plugin')).toBeVisible();
    expect(k8sPatch).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(props.closeOverlay).toHaveBeenCalled());
    expect(k8sPatch).toHaveBeenCalledWith(ConsoleOperatorConfigModel, consoleOperatorConfig, [
      { op: 'add', path: '/spec/plugins', value: ['test-plugin'] },
    ]);
  });

  const unavailableConfigurations: [
    string,
    ReturnType<typeof useK8sWatchResource<ConsolePluginKind>>,
  ][] = [
    ['loading', [undefined, false, undefined]],
    ['failed to load', [undefined, false, new Error('Not found')]],
  ];
  it.each(unavailableConfigurations)(
    'should allow enablement with a conditional warning when configuration is %s',
    async (_name, result) => {
      mockWatch.mockReturnValue(result);
      const user = userEvent.setup();
      render(<ConsolePluginModalOverlay {...props} />);

      await user.click(screen.getByRole('radio', { name: 'Enable' }));

      expect(screen.getByText(/If it declares a UserToken proxy/)).toBeVisible();
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    },
  );

  it('should omit the token warning when the loaded plugin declares no UserToken proxies', async () => {
    mockWatch.mockReturnValue([
      { ...consolePlugin, spec: { ...consolePlugin.spec, proxy: [consolePlugin.spec.proxy[1]] } },
      true,
      undefined,
    ]);
    const user = userEvent.setup();
    render(<ConsolePluginModalOverlay {...props} />);

    await user.click(screen.getByRole('radio', { name: 'Enable' }));

    expect(screen.queryByText('Enabling console plugin')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('should cancel enablement without patching configuration', async () => {
    const user = userEvent.setup();
    render(<ConsolePluginModalOverlay {...props} />);
    await user.click(screen.getByRole('radio', { name: 'Enable' }));

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(k8sPatch).not.toHaveBeenCalled();
    expect(props.closeOverlay).toHaveBeenCalled();
  });
});
