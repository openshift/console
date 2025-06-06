import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import { verifyFormField, controlButtonTest, verifyPageTitleAndSubtitle } from './testUtils';
import { AddKeystonePage } from '../../../public/components/cluster-settings/keystone-idp-form';

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
    verifyFormField({
      labelText: 'Name',
      inputRole: 'textbox',
      inputName: 'Name',
      inputValue: 'keystone',
      inputId: 'idp-name',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
    });
  });

  it('should render the Domain name label and input field', () => {
    verifyFormField({
      labelText: 'Domain name',
      inputRole: 'textbox',
      inputName: 'Domain name',
      inputValue: '',
      inputId: 'domain-name',
      helpText: '',
    });
  });

  it('should render the URL label, input field, and help text', () => {
    verifyFormField({
      labelText: 'URL',
      inputRole: 'textbox',
      inputName: 'URL',
      inputValue: '',
      inputId: 'url',
      helpText: 'The remote URL to connect to.',
    });
  });

  it('should render the CA file label and fields', () => {
    verifyFormField({
      labelText: 'CA file',
      inputRole: 'textbox',
      inputName: 'CA file',
      inputValue: '',
      inputId: 'ca-file-input',
      helpText: '',
    });

    // Verify the Browse button is rendered
    const browseButton = screen.getAllByText('Browse...');
    expect(browseButton[0]).toBeVisible();

    // Verify the textarea is rendered with the correct attribute
    expect(screen.getByLabelText('CA file')).toBeVisible();
  });
  it('should render the certificate label and fields', () => {
    verifyFormField({
      labelText: 'Certificate',
      inputRole: 'textbox',
      inputName: 'Certificate',
      inputValue: '',
      inputId: 'cert-file-input',
      helpText: 'PEM-encoded TLS client certificate to present when connecting to the server.',
    });

    // Verify the Browse button is rendered
    const browseButton = screen.getAllByText('Browse...');
    expect(browseButton[1]).toBeVisible();

    // Verify the textarea is rendered with the correct attribute
    expect(screen.getByLabelText('Certificate')).toBeVisible();
  });

  it('should render the key label and fields', () => {
    verifyFormField({
      labelText: 'Key',
      inputRole: 'textbox',
      inputName: 'Key',
      inputValue: '',
      inputId: 'key-file-input',
      helpText:
        'PEM-encoded TLS private key for the client certificate. Required if certificate is specified.',
    });

    // Verify the Browse button is rendered
    const browseButton = screen.getAllByText('Browse...');
    expect(browseButton[2]).toBeVisible();

    // Verify the textarea is rendered with the correct attribute
    expect(screen.getByLabelText('Key')).toBeVisible();
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    controlButtonTest();
  });
});
