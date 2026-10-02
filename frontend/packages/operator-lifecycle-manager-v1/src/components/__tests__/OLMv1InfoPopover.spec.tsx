import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { OLMv1InfoPopover } from '../OLMv1InfoPopover';

describe('OLMv1InfoPopover', () => {
  it('should render an info trigger without Tech Preview framing', () => {
    renderWithProviders(<OLMv1InfoPopover />);

    expect(screen.getByRole('button', { name: 'OLMv1 information' })).toBeInTheDocument();
    expect(screen.queryByText('Tech Preview')).not.toBeInTheDocument();
  });

  it('should describe OLMv1 without Tech Preview framing when opened', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OLMv1InfoPopover />);

    await user.click(screen.getByRole('button', { name: 'OLMv1 information' }));

    expect(
      await screen.findByText(
        'Lets you use Next-Gen (OLMv1), a streamlined redesign of Classic (OLMv0). OLMv1 simplifies operator management with declarative APIs, enhanced security, and direct, GitOps-friendly control over upgrades.',
      ),
    ).toBeInTheDocument();
  });
});
