import { AddBasicAuthPage } from '../../cluster-settings/basicauth-idp-form';
import { screen } from '@testing-library/react';
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
  const renderPage = async () => {
    renderWithProviders(<AddBasicAuthPage />);
    expect(await screen.findByRole('button', { name: 'Add' })).toBeInTheDocument();
  };

  beforeAll(() => {
    setupFileReaderMock();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should render page title and sub title', async () => {
    await renderPage();
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: Basic Authentication',
      subtitle:
        'Basic authentication is a generic backend integration mechanism that allows users to authenticate with credentials validated against a remote identity provider.',
    });
  });

  it('should render the Name label, input element, and help text', async () => {
    await renderPage();
    await verifyInputField({
      inputLabel: 'Name',
      initialValue: 'basic-auth',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the URL label, input element, and help text', async () => {
    await renderPage();
    await verifyInputField({
      inputLabel: 'URL',
      inputType: 'url',
      testValue: mockData.updatedFormValues.url,
      helpText: 'The remote URL to connect to.',
      isRequired: true,
    });
  });

  it('should render the CA file label and elements', async () => {
    await renderPage();
    await verifyIDPFileFields({
      inputLabel: 'CA file',
      fieldId: 'ca-file-input',
    });
  });

  it('should render the certificate label and elements', async () => {
    await renderPage();
    await verifyIDPFileFields({
      inputLabel: 'Certificate',
      fieldId: 'cert-file-input',
      helpText: 'PEM-encoded TLS client certificate file',
    });
  });

  it('should render the key label and elements', async () => {
    await renderPage();
    await verifyIDPFileFields({
      inputLabel: 'Key',
      fieldId: 'key-file-input',
      helpText: 'PEM-encoded TLS private key file',
    });
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", async () => {
    await renderPage();
    verifyIDPAddAndCancelButtons();
  });
});
