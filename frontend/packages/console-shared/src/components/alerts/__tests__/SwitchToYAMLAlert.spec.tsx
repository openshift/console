import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import SwitchToYAMLAlert from '../SwitchToYAMLAlert';

describe('SwitchToYAMLAlert', () => {
  it('should render alert with correct text', () => {
    renderWithProviders(<SwitchToYAMLAlert />);

    expect(
      screen.getByText(
        'Some fields might not be displayed in this form. Select YAML view to edit all fields.',
      ),
    ).toBeInTheDocument();
  });

  it('should render as info variant alert', () => {
    renderWithProviders(<SwitchToYAMLAlert />);

    const alert = screen.getByTestId('info-alert');
    expect(alert).toHaveClass('pf-m-info');
  });

  it('should render as inline alert', () => {
    renderWithProviders(<SwitchToYAMLAlert />);

    const alert = screen.getByTestId('info-alert');
    expect(alert).toHaveClass('pf-m-inline');
  });

  it('should not show close button when onClose is not provided', () => {
    renderWithProviders(<SwitchToYAMLAlert />);

    const closeButton = screen.queryByRole('button', { name: /close/i });
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should show close button when onClose is provided', () => {
    const mockOnClose = jest.fn();
    renderWithProviders(<SwitchToYAMLAlert onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    renderWithProviders(<SwitchToYAMLAlert onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
