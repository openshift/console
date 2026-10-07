import { render, screen } from '@testing-library/react';
import { consolePlugin } from '../../../test-utils/console-plugin';
import { ConsolePluginWarning } from '../ConsolePluginWarning';

describe('ConsolePluginWarning', () => {
  const props = {
    enabled: true,
    previouslyEnabled: false,
    trusted: true,
    proxies: consolePlugin.spec.proxy,
  };

  it('should disclose token delegation and affected services even for trusted plugins', () => {
    render(<ConsolePluginWarning {...props} />);

    expect(screen.getByText('Enabling console plugin')).toBeVisible();
    expect(
      screen.getByText(/Requests can occur automatically when the console loads/),
    ).toBeVisible();
    expect(screen.getByRole('listitem')).toHaveTextContent('private-api: plugins/plugin-api:8443');
    expect(screen.queryByText('public-api: plugins/public-api:8443')).not.toBeInTheDocument();
    expect(screen.queryByText(/provide a custom interface/)).not.toBeInTheDocument();
  });

  it.each([
    ['known UserToken', consolePlugin.spec.proxy],
    ['unavailable', undefined],
  ])('should combine general trust and %s token warnings in one alert', (_name, proxies) => {
    render(<ConsolePluginWarning {...props} trusted={false} proxies={proxies} />);

    expect(screen.getAllByText('Enabling console plugin')).toHaveLength(1);
    expect(screen.getByText(/provide a custom interface/)).toBeVisible();
    expect(
      screen.getByText(/Requests can occur automatically when the console loads/),
    ).toBeVisible();
    expect(screen.queryByText('User token access')).not.toBeInTheDocument();
  });

  it.each([
    ['no proxies', []],
    ['None proxies', [consolePlugin.spec.proxy[1]]],
  ])('should omit the token warning for a known configuration with %s', (_name, proxies) => {
    render(<ConsolePluginWarning {...props} proxies={proxies} />);

    expect(screen.queryByText('Enabling console plugin')).not.toBeInTheDocument();
  });

  it('should retain only the general warning for an untrusted plugin without UserToken proxies', () => {
    render(<ConsolePluginWarning {...props} trusted={false} proxies={[]} />);

    expect(screen.getByText('Enabling console plugin')).toBeVisible();
    expect(screen.getByText(/provide a custom interface/)).toBeVisible();
    expect(screen.queryByText(/OAuth token/)).not.toBeInTheDocument();
  });

  it('should explain token access conditionally when configuration is unavailable', () => {
    render(<ConsolePluginWarning {...props} proxies={undefined} />);

    expect(screen.getByText(/If it declares a UserToken proxy/)).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it.each([
    ['disabling', { enabled: false }],
    ['already enabled', { previouslyEnabled: true }],
  ])('should omit enablement warnings when %s', (_name, state) => {
    render(<ConsolePluginWarning {...props} {...state} />);

    expect(screen.queryByText('Enabling console plugin')).not.toBeInTheDocument();
  });
});
