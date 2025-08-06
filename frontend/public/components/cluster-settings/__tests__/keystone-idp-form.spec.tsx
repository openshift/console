import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  verifyInputField,
  verifyIDPAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
  verifyIDPFileFields,
  mockData,
  setupFileReaderMock,
} from './test-utils';
import { AddKeystonePage } from '../../cluster-settings/keystone-idp-form';

describe('Add Identity Provider: Keystone Authentication', () => {
  beforeEach(() => {
    renderWithProviders(<AddKeystonePage />);
  });

  beforeAll(() => {
    setupFileReaderMock();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: Keystone Authentication',
      subtitle:
        'Adding Keystone enables shared authentication with an OpenStack server configured to store users in an internal Keystone database.',
    });
  });

  it('should render the Name label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'keystone',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the Domain name label and input element', () => {
    verifyInputField({
      inputLabel: 'Domain name',
      testValue: mockData.updatedFormValues.url,
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
      inputLabel: 'Certificate',
      idPrefix: 'key-file-input',
      helpText:
        'PEM-encoded TLS private key for the client certificate. Required if certificate is specified.',
    });
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    verifyIDPAddAndCancelButtons();
  });
});
