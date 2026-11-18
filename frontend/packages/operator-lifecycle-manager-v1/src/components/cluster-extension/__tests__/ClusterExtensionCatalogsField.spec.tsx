import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import { ClusterExtensionCatalogsField } from '../ClusterExtensionCatalogsField';

jest.mock('@console/shared/src/components/markdown/MarkdownView', () => ({
  MarkdownView: ({ content }) => content,
}));

describe('ClusterExtensionCatalogsField', () => {
  it('renders labeled input and field-specific helper text', async () => {
    renderWithProviders(
      <ClusterExtensionCatalogsField fieldId="catalogs" values={[]} onChange={jest.fn()} />,
    );
    await verifyInputField({
      inputLabel: 'Catalogs',
      helpText: 'Package will only be resolved from specified catalogs.',
    });
  });

  it('focuses input when clicking its visible label', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ClusterExtensionCatalogsField fieldId="catalogs" values={[]} onChange={jest.fn()} />,
    );
    await user.click(screen.getByText('Catalogs'));
    expect(screen.getByRole('textbox', { name: 'Catalogs' })).toHaveFocus();
  });

  it('displays existing selections and propagates removal', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <ClusterExtensionCatalogsField
        fieldId="catalogs"
        values={['redhat-operators']}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('redhat-operators')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close redhat-operators' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('propagates selected values from shared tag input', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <ClusterExtensionCatalogsField fieldId="catalogs" values={[]} onChange={onChange} />,
    );
    await verifyInputField({ inputLabel: 'Catalogs', testValue: 'redhat-operators' });
    await user.tab();
    expect(onChange).toHaveBeenCalledWith(['redhat-operators']);
  });

  it('shows duplicate resource selections only once', () => {
    renderWithProviders(
      <ClusterExtensionCatalogsField
        fieldId="catalogs"
        values={['redhat-operators', 'redhat-operators']}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getAllByRole('button', { name: 'Close redhat-operators' })).toHaveLength(1);
  });

  it('shows field-specific schema help fallback', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ClusterExtensionCatalogsField fieldId="catalogs" values={[]} onChange={jest.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: 'Catalogs help' }));
    expect(
      await screen.findByText(
        'Catalogs to use when selecting the Operator package. If you leave this empty, Operator Lifecycle Manager searches all catalogs.',
      ),
    ).toBeVisible();
  });
});
