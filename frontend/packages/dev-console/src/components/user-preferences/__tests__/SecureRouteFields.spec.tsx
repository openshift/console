import { configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SecureRouteFields from '../SecureRouteFields';
import { usePreferredRoutingOptions } from '../usePreferredRoutingOptions';

configure({ testIdAttribute: 'id' });

jest.mock('../usePreferredRoutingOptions', () => ({
  usePreferredRoutingOptions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

const mockUsePreferredRoutingOptions = usePreferredRoutingOptions as jest.Mock;

describe('SecureRouteFields', () => {
  it('should render Secure Route Fields component', () => {
    mockUsePreferredRoutingOptions.mockReturnValue([{}, () => {}, true]);
    render(<SecureRouteFields />);
    expect(screen.queryByTestId('secure-route-checkbox')).not.toBeNull();
    expect(screen.queryByTestId('insecure-traffic')).not.toBeNull();
    expect(screen.queryByTestId('tls-termination')).not.toBeNull();
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
    const inSecureTraffic = screen.queryByTestId('insecure-traffic');
    fireEvent.click(inSecureTraffic);
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /Allow/i })).toBeNull();
      expect(screen.queryByRole('option', { name: /None/i })).not.toBeNull();
      expect(screen.queryByRole('option', { name: /Redirect/i })).not.toBeNull();
    });
  });

  it('should show Allow, None and  Redirect options in Insecure traffic dropdown if TLS termination is not Passthrough', async () => {
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
    const inSecureTraffic = screen.queryByTestId('insecure-traffic');
    fireEvent.click(inSecureTraffic);
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /Allow/i })).not.toBeNull();
      expect(screen.queryByRole('option', { name: /None/i })).not.toBeNull();
      expect(screen.queryByRole('option', { name: /Redirect/i })).not.toBeNull();
    });
  });
});
