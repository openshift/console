import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import {
  verifyFormField,
  controlButtonTest,
  verifyInputPasswordField,
  verifyPageTitleAndSubtitle,
  verifyListInput,
} from './testUtils';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import { AddLDAPPage } from '../../cluster-settings/ldap-idp-form';

describe('Add Identity Provider: LDAP', () => {
  beforeEach(() => {
    renderWithProviders(<AddLDAPPage />);
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: LDAP',
      subtitle: 'Integrate with an LDAP identity provider.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    const labelText = 'Name';
    const inputRole = 'textbox';
    const inputName = 'Name';
    const inputValue = 'ldap';
    const inputId = 'idp-name';
    const helpText = 'Unique name of the new identity provider. This cannot be changed later.';

    const section = screen.getByTestId('idp-name-form-group');
    const label = within(section).getByText(labelText, { exact: true });
    expect(label).toBeVisible();

    // Verify the label is associated with the correct input field
    expect(label).toHaveAttribute('for', inputId);

    // Verify the input field
    // TODO: Clean up later on
    const input = within(section).getByRole(inputRole, { name: inputName, exact: true });
    expect(input).toBeVisible();
    expect(input).toHaveValue(inputValue);

    // Verify the help text
    if (helpText) {
      expect(screen.getByText(helpText)).toBeVisible();
    }
  });

  it('should render the URL label, input field, and help text', () => {
    verifyFormField({
      labelText: 'URL',
      inputRole: 'textbox',
      inputName: 'URL',
      inputValue: '',
      inputId: 'url',
      helpText: 'An RFC 2255 URL which specifies the LDAP search parameters to use.',
      isRequired: true,
    });
  });

  it('should render the Bind DN label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Bind DN',
      inputRole: 'textbox',
      inputName: 'Bind DN',
      inputValue: '',
      inputId: 'bind-dn',
      helpText: 'DN to bind with during the search phase.',
    });
  });

  it('should render the Bind Password label and input password field', () => {
    verifyInputPasswordField({
      labelText: 'Bind password',
      inputId: 'bind-password',
      helpText: 'DN to bind with during the search phase.',
    });
  });

  it('should render the Attributes sub heading', () => {
    expect(screen.getByRole('heading', { name: 'Attributes' })).toBeVisible();
  });

  it('should render the Attributes ID label, input field, and help text', () => {
    verifyFormField({
      labelText: 'ID',
      inputRole: 'textbox',
      inputName: 'ID',
      inputValue: 'dn',
      inputId: 'list-input',
      helpText: 'The list of attributes whose values should be used as the user ID.',
    });
    verifyListInput({
      labelText: 'Name',
      inputId: 'ldap-form-list-input',
      inputValue: 'cn',
      helpText: 'The list of attributes whose values should be used as the display name.',
    });
  });

  it('should render the Attributes ID label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Preferred username',
      inputRole: 'textbox',
      inputName: 'Preferred username',
      inputValue: 'uid',
      inputId: 'list-input',
      helpText: 'The list of attributes whose values should be used as the preferred username.',
    });
  });

  it('should render the Attributes Name label, input field, and help text', () => {
    verifyListInput({
      labelText: 'Name',
      inputId: 'ldap-form-list-input',
      inputValue: 'cn',
      helpText: 'The list of attributes whose values should be used as the display name.',
    });
  });

  it('should render the Attributes Email label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Email',
      inputRole: 'textbox',
      inputName: 'Email',
      inputValue: '',
      inputId: 'list-input',
      helpText: 'The list of attributes whose values should be used as the email address.',
    });
  });

  it('should render the More options sub heading and CA file label and input field', () => {
    expect(screen.getByRole('heading', { name: 'More options' })).toBeVisible();

    verifyFormField({
      labelText: 'CA file',
      inputRole: 'textbox',
      inputName: 'CA file',
      inputValue: '',
      inputId: 'ca-file-input',
      helpText: '',
    });

    // Verify the Browse button is rendered
    const browseButton = screen.getByText('Browse...');
    expect(browseButton).toBeVisible();

    // Verify the textarea is rendered with the correct attribute
    expect(screen.getByLabelText('CA file')).toBeVisible();
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest();
  });
});
