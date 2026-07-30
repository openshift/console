import { configure, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SecureRouteFields from '../SecureRouteFields';
import { usePreferredRoutingOptions } from '../usePreferredRoutingOptions';

jest.mock('../usePreferredRoutingOptions', () => ({
  usePreferredRoutingOptions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

const mockUsePreferredRoutingOptions = usePreferredRoutingOptions as jest.Mock;

configure({ testIdAttribute: 'id' });

describe('SecureRouteFields', () => {
  it('should render Secure Route Fields component', () => {
    mockUsePreferredRoutingOptions.mockReturnValue([{}, () => {}, true]);
    render(<SecureRouteFields />);
    expect(screen.getByTestId('secure-route-checkbox')).toBeVisible();
    expect(screen.getByTestId('insecure-traffic')).toBeVisible();
    expect(screen.getByTestId('tls-termination')).toBeVisible();
  });

  it('should render skeleton if usePreferredRoutingOptions is not loaded', () => {
    mockUsePreferredRoutingOptions.mockReturnValue([{}, () => {}, false]);
    render(<SecureRouteFields />);
    const secureRouteCheckbox = screen.queryByTestId('secure-route-checkbox');
    const tlsTermination = screen.queryByTestId('tls-termination');
    const inSecureTraffic = screen.queryByTestId('insecure-traffic');
    expect(secureRouteCheckbox.hasAttribute('disabled')).toBeTruthy();
    expect(tlsTermination.hasAttribute('disabled')).toBeTruthy();
    expect(inSecureTraffic.hasAttribute('disabled')).toBeTruthy();
  });

  it('should not show Allow option in Insecure traffic dropdown if TLS termination is Passthrough', async () => {
    const user = userEvent.setup();
    mockUsePreferredRoutingOptions.mockReturnValue([
      {
        secure: true,
        tlsTermination: 'passthrough',
        insecureTraffic: 'Redirect',
      },
      () => {},
      true,
    ]);
    render(<SecureRouteFields />);
    const inSecureTraffic = screen.getByTestId('insecure-traffic');
    await user.click(inSecureTraffic);
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /Allow/i })).toBeNull();
      expect(screen.getByRole('option', { name: /None/i })).toBeVisible();
      expect(screen.getByRole('option', { name: /Redirect/i })).toBeVisible();
    });
  });

  it('should show Allow, None and  Redirect options in Insecure traffic dropdown if TLS termination is not Passthrough', async () => {
    const user = userEvent.setup();
    mockUsePreferredRoutingOptions.mockReturnValue([
      {
        secure: true,
        tlsTermination: 'edge',
        insecureTraffic: 'Redirect',
      },
      () => {},
      true,
    ]);
    render(<SecureRouteFields />);
    const inSecureTraffic = screen.getByTestId('insecure-traffic');
    await user.click(inSecureTraffic);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Allow/i })).toBeVisible();
      expect(screen.getByRole('option', { name: /None/i })).toBeVisible();
      expect(screen.getByRole('option', { name: /Redirect/i })).toBeVisible();
    });
  });
});
