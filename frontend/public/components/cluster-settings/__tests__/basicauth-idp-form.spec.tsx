import { cleanup } from '@testing-library/react';
import { AddBasicAuthPage } from '../../cluster-settings/basicauth-idp-form';
import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import {
  verifyIDPAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
  verifyIDPFileFields,
  mockData,
  setupFileReaderMock,
} from './test-utils';

describe('Add Identity Provider: Basic Authentication', () => {
  beforeAll(() => {
    setupFileReaderMock();
  });

  beforeEach(() => {
    renderWithProviders(<AddBasicAuthPage />);
  });

  afterEach(() => {
    cleanup();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: Basic Authentication',
      subtitle:
        'Basic authentication is a generic backend integration mechanism that allows users to authenticate with credentials validated against a remote identity provider.',
    });
  });

  it('should render the Name label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'basic-auth',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the URL label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'URL',
      inputType: 'url',
      testValue: mockData.updatedFormValues.url,
      helpText: 'The remote URL to connect to.',
      isRequired: true,
    });
  });

  it('should render the CA file label and elements', () => {
    verifyIDPFileFields({
      inputLabel: 'CA file',
      idPrefix: 'ca-file-input',
    });
  });

  it('should render the certificate label and elements', () => {
    verifyIDPFileFields({
      inputLabel: 'Certificate',
      idPrefix: 'cert-file-input',
      helpText: 'PEM-encoded TLS client certificate to present when connecting to the server.',
    });
  });

  it('should render the key label and elements', () => {
    verifyIDPFileFields({
      inputLabel: 'Key',
      idPrefix: 'key-file-input',
      helpText:
        'PEM-encoded TLS private key for the client certificate. Required if certificate is specified.',
    });
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    verifyIDPAddAndCancelButtons();
  });
});
