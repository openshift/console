import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { OLMv1InfoPopover } from '../OLMv1InfoPopover';

describe('OLMv1InfoPopover', () => {
  it('should name the info trigger after Operator Lifecycle Manager version 1', () => {
    renderWithProviders(<OLMv1InfoPopover />);

    expect(
      screen.getByRole('button', { name: 'About Operator Lifecycle Manager version 1' }),
    ).toBeInTheDocument();
  });

  it('should explain OLMv1 Operator management and Technology Preview status when opened', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OLMv1InfoPopover />);

    await user.click(
      screen.getByRole('button', { name: 'About Operator Lifecycle Manager version 1' }),
    );

    expect(
      await screen.findByText(
        'Operator Lifecycle Manager version 1 is a redesign of Operator Lifecycle Manager version 0. It simplifies Operator management with declarative APIs and gives you direct, GitOps-friendly control over upgrades. Operator Lifecycle Manager version 1 is a Technology Preview feature. For production clusters, continue to use classic Operators.',
      ),
    ).toBeInTheDocument();
  });
});
