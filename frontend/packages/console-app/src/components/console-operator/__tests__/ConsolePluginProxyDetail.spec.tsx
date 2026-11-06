import { screen } from '@testing-library/react';
import { consolePlugin } from '@console/shared/src/test-utils/console-plugin';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ConsolePluginProxyDetail from '../ConsolePluginProxyDetail';

jest.mock('@console/dynamic-plugin-sdk/src/runtime/plugin-init', () => ({
  initConsolePlugins: jest.fn(),
}));

describe('ConsolePluginProxyDetail', () => {
  it('should show authorization modes and warn for UserToken proxies', () => {
    renderWithProviders(<ConsolePluginProxyDetail obj={consolePlugin} />);

    expect(screen.getByText(/Authorization: UserToken/)).toBeVisible();
    expect(screen.getByText(/Authorization: None/)).toBeVisible();
    expect(screen.getByText('User token access')).toBeVisible();
  });

  it('should display omitted authorization as None without a token warning', () => {
    const proxy = { ...consolePlugin.spec.proxy[1], authorization: undefined };
    renderWithProviders(
      <ConsolePluginProxyDetail
        obj={{ ...consolePlugin, spec: { ...consolePlugin.spec, proxy: [proxy] } }}
      />,
    );

    expect(screen.getByText(/Authorization: None/)).toBeVisible();
    expect(screen.queryByText('User token access')).not.toBeInTheDocument();
  });
});
