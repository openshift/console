import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import {
  verifyInputField,
  verifyAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
} from './testUtils';
import { AddKeystonePage } from '../../cluster-settings/keystone-idp-form';

describe('Add Identity Provider: Keystone Authentication', () => {
  beforeEach(() => {
    renderWithProviders(<AddKeystonePage />);
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: Keystone Authentication',
      subtitle:
        'Adding Keystone enables shared authentication with an OpenStack server configured to store users in an internal Keystone database.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'keystone',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the Domain name label and input field', () => {
    verifyInputField({
      inputLabel: 'Domain name',
      helpText: '',
      isRequired: true,
    });
  });

  it('should render the URL label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'URL',
      inputType: 'url',
      helpText: 'The remote URL to connect to.',
      isRequired: true,
    });
  });

  it('should render the CA file label and fields', () => {
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

  it('should render the certificate label and fields', () => {
    verifyInputField({
      inputLabel: 'Certificate filename',
      containerId: 'cert-file-input-text',
    });

    verifyInputField({
      inputLabel: 'Browse...',
      containerId: 'cert-file-input-file',
      inputType: 'file',
      helpText: 'PEM-encoded TLS client certificate to present when connecting to the server.',
    });

    expect(screen.getByRole('textbox', { name: 'Certificate' })).toBeVisible();
  });

  it('should render the key label and fields', () => {
    verifyInputField({
      inputLabel: 'Key filename',
      containerId: 'key-file-input-text',
    });

    verifyInputField({
      inputLabel: 'Browse...',
      containerId: 'key-file-input-file',
      inputType: 'file',
    });

    expect(screen.getByRole('textbox', { name: 'Key Content' })).toBeVisible();
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    verifyAddAndCancelButtons();
  });
});
