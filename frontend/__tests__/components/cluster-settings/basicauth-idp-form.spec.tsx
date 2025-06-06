import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
//import userEvent from '@testing-library/user-event'; // TODO: Update to the wrapper for user-event package
import { AddBasicAuthPage } from '../../../public/components/cluster-settings/basicauth-idp-form';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import { verifyFormField, controlButtonTest, verifyPageTitleAndSubtitle } from './testUtils';

describe('Add Identity Provider: Basic Authentication', () => {
  beforeEach(() => {
    renderWithProviders(<AddBasicAuthPage />);
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: Basic Authentication',
      subtitle:
        'Basic authentication is a generic backend integration mechanism that allows users to authenticate with credentials validated against a remote identity provider.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Name',
      inputRole: 'textbox',
      inputName: 'Name',
      inputValue: 'basic-auth',
      inputId: 'idp-name',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
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
    const browseLabel = screen.getAllByText('Browse...'); // Fix the issue with getByLabelText
    expect(browseLabel[0]).toBeVisible();
    expect(browseLabel[0]).toHaveAttribute('for', 'ca-file-input');

    // Verify the textarea is rendered with the correct attribute
    expect(screen.getByLabelText('CA file')).toBeVisible();
  });

  //TODO: Update the userEvent package to the wrapper for user-event package
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
