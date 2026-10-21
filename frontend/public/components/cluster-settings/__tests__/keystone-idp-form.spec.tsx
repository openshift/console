import { cleanup, act } from '@testing-library/react';
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
import { AddKeystonePage } from '../../cluster-settings/keystone-idp-form';

describe('Add Identity Provider: Keystone Authentication', () => {
  beforeAll(() => {
    setupFileReaderMock();
  });

  beforeEach(async () => {
    await act(async () => {
      renderWithProviders(<AddKeystonePage />);
    });
  });

  afterEach(() => {
    cleanup();
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

  it('should render the CA file label and elements', async () => {
    await verifyIDPFileFields({
      inputLabel: 'CA file',
    });
  });

  it('should render the certificate label and elements', async () => {
    await verifyIDPFileFields({
      inputLabel: 'Certificate',
      helpText: 'PEM-encoded TLS client certificate file',
    });
  });

  it('should render the key label and elements', async () => {
    await verifyIDPFileFields({
      inputLabel: 'Key',
      helpText: 'PEM-encoded TLS private key file',
    });
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    verifyIDPAddAndCancelButtons();
  });
});
