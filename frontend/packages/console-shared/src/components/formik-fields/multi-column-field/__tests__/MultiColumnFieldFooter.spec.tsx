import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test-utils/unit-test-utils';
import MultiColumnFieldFooter from '../MultiColumnFieldFooter';

describe('MultiColumnFieldFooter', () => {
  it('should render an enabled add button by default, but without a tooltip', () => {
    renderWithProviders(<MultiColumnFieldFooter onAdd={jest.fn()} />);

    const button = screen.getByRole('button', { name: 'Add values' });
    expect(button).toBeVisible();
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should render a disabled button when disableAddRow is true', async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    renderWithProviders(<MultiColumnFieldFooter onAdd={onAdd} disableAddRow />);

    const button = screen.getByRole('button', { name: 'Add values' });
    expect(button).toBeVisible();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    // Verify button doesn't trigger callback when disabled
    await user.click(button);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('should render a disabled button with tooltipAddRow prop', async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    renderWithProviders(
      <MultiColumnFieldFooter onAdd={onAdd} disableAddRow tooltipAddRow="Disabled add button" />,
    );

    const button = screen.getByRole('button', { name: 'Add values' });
    expect(button).toBeVisible();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    // Verify button doesn't trigger callback when disabled
    await user.click(button);
    expect(onAdd).not.toHaveBeenCalled();

    // Hover over button to show tooltip
    await user.hover(button);

    // Verify tooltip text appears (wait until visible; tooltip may mount before Popper shows it)
    await waitFor(() => {
      expect(screen.getByText('Disabled add button')).toBeVisible();
    });
  });
});
