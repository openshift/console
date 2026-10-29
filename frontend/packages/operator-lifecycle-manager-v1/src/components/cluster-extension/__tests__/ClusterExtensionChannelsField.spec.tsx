import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import { ClusterExtensionChannelsField } from '../ClusterExtensionChannelsField';

jest.mock('@console/shared/src/components/markdown/MarkdownView', () => ({
  MarkdownView: ({ content }) => content,
}));

describe('ClusterExtensionChannelsField', () => {
  it('renders labeled input and field-specific helper text', async () => {
    renderWithProviders(
      <ClusterExtensionChannelsField fieldId="channels" values={[]} onChange={jest.fn()} />,
    );
    await verifyInputField({ inputLabel: 'Channels', helpText: 'For example, stable, beta' });
  });

  it('focuses input when clicking its visible label', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ClusterExtensionChannelsField fieldId="channels" values={[]} onChange={jest.fn()} />,
    );
    await user.click(screen.getByText('Channels'));
    expect(screen.getByRole('textbox', { name: 'Channels' })).toHaveFocus();
  });

  it('displays existing selections and propagates removal', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <ClusterExtensionChannelsField fieldId="channels" values={['stable']} onChange={onChange} />,
    );
    expect(screen.getByText('stable')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close stable' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('propagates selected values from shared tag input', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <ClusterExtensionChannelsField fieldId="channels" values={[]} onChange={onChange} />,
    );
    await verifyInputField({ inputLabel: 'Channels', testValue: 'stable' });
    await user.tab();
    expect(onChange).toHaveBeenCalledWith(['stable']);
  });

  it('shows duplicate resource selections only once', () => {
    renderWithProviders(
      <ClusterExtensionChannelsField
        fieldId="channels"
        values={['stable', 'stable']}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getAllByRole('button', { name: 'Close stable' })).toHaveLength(1);
  });

  it('shows field-specific schema help fallback', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ClusterExtensionChannelsField fieldId="channels" values={[]} onChange={jest.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: 'Channels help' }));
    expect(
      await screen.findByText(
        'Channels that constrain available versions and automatic update paths. If you leave this empty, Operator Lifecycle Manager considers all channels.',
      ),
    ).toBeVisible();
  });
});
