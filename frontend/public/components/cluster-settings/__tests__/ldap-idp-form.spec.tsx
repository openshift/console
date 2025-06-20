import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import {
  verifyInputField,
  verifyAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
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
    verifyInputField({
      inputLabel: 'Name',
      containerId: 'idp-name-form-group',
      initialValue: 'ldap',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the URL label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'URL',
      inputType: 'url',
      helpText: 'An RFC 2255 URL which specifies the LDAP search parameters to use.',
      isRequired: true,
    });
  });

  it('should render the Bind DN label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Bind DN',
      helpText: 'DN to bind with during the search phase.',
    });
  });

  it('should render the Bind Password label and input password field', () => {
    verifyInputField({
      inputLabel: 'Bind password',
      inputType: 'password',
      helpText: 'DN to bind with during the search phase.',
    });
  });

  it('should render the Attributes sub heading', () => {
    expect(screen.getByRole('heading', { name: 'Attributes' })).toBeVisible();
  });

  it('should render the Attributes > ID label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'ID',
      initialValue: 'dn',
      helpText: 'The list of attributes whose values should be used as the user ID.',
    });
  });

  it('should render the Attributes > Preferred username label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Preferred username',
      initialValue: 'uid',
      helpText: 'The list of attributes whose values should be used as the preferred username.',
    });
  });

  it('should render the Attributes Name label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      containerId: 'ldap-form-attributes-list-input',
      initialValue: 'cn',
      helpText: 'The list of attributes whose values should be used as the display name.',
    });
  });

  it('should render the Attributes Email label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Email',
      helpText: 'The list of attributes whose values should be used as the email address.',
    });
  });

  it('should render the More options sub heading and CA file label and input field', () => {
    expect(screen.getByRole('heading', { name: 'More options' })).toBeVisible();

    verifyInputField({
      inputLabel: 'CA file filename',
      containerId: 'ca-file-input-text',
    });

    verifyInputField({
      inputLabel: 'Browse...',
      containerId: 'ca-file-input-file',
      inputType: 'file',
    });

    expect(screen.getByRole('textbox', { name: 'CA file' })).toBeVisible();
  });

  it('should render control buttons in a button bar', () => {
    verifyAddAndCancelButtons();
  });
});
