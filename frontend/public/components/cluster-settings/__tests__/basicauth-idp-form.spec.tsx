import '@testing-library/jest-dom';
import { AddBasicAuthPage } from '../../cluster-settings/basicauth-idp-form';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import {
  verifyInputField,
  verifyAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
  verifyIDPFileFields,
} from './testUtils';

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
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'basic-auth',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
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
    verifyIDPFileFields({
      inputLabel: 'CA file',
      idPrefix: 'ca-file-input',
    });
  });

  it('should render the certificate label and fields', () => {
    verifyIDPFileFields({
      inputLabel: 'Certificate',
      idPrefix: 'cert-file-input',
      helpText: 'PEM-encoded TLS client certificate to present when connecting to the server.',
    });
  });

  it('should render the key label and fields', () => {
    verifyIDPFileFields({
      inputLabel: 'Certificate',
      idPrefix: 'key-file-input',
      helpText: 'PEM-encoded TLS client certificate to present when connecting to the server.',
    });
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    verifyAddAndCancelButtons();
  });
});
