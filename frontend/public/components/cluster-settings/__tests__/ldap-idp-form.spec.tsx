import { cleanup, screen, act } from '@testing-library/react';
import {
  verifyIDPAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
  verifyIDPFileFields,
  verifyIDPListInputFields,
  mockData,
  setupFileReaderMock,
} from './test-utils';
import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import { AddLDAPPage } from '../../cluster-settings/ldap-idp-form';

describe('Add Identity Provider: LDAP', () => {
  beforeAll(() => {
    setupFileReaderMock();
  });

  beforeEach(async () => {
    await act(async () => {
      renderWithProviders(<AddLDAPPage />);
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
      title: 'Add Identity Provider: LDAP',
      subtitle: 'Integrate with an LDAP identity provider.',
    });
  });

  it('should render the Name label, input element, and help text', async () => {
    await verifyInputField({
      inputLabel: 'Name',
      containerId: 'idp-name-form',
      initialValue: 'ldap',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the URL label, input element, and help text', async () => {
    await verifyInputField({
      inputLabel: 'URL',
      inputType: 'url',
      testValue: mockData.updatedFormValues.url,
      helpText: 'An RFC 2255 URL which specifies the LDAP search parameters to use.',
      isRequired: true,
    });
  });

  it('should render the Bind DN label, input element, and help text', async () => {
    await verifyInputField({
      inputLabel: 'Bind DN',
      testValue: mockData.updatedFormValues.updatedValue,
      helpText: 'DN to bind with during the search phase.',
    });
  });

  it('should render the Bind Password label and input password element', async () => {
    await verifyInputField({
      inputLabel: 'Bind password',
      inputType: 'password',
      testValue: mockData.updatedFormValues.secret,
      helpText: 'Password to bind with during the search phase.',
    });
  });

  it('should render the Attributes sub heading', () => {
    expect(screen.getByRole('heading', { name: 'Attributes' })).toBeVisible();
    expect(screen.getByText('Attributes map LDAP attributes to identities.')).toBeVisible();
  });

  it('should render the Attributes > ID label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'ID',
      initialValue: 'dn',
      testValue: mockData.updatedFormValues.id,
      testId: 'ldap-attribute-id',
      helpText: 'The list of attributes whose values should be used as the user ID.',
    });
  });

  it('should render the Attributes > Preferred username label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Preferred username',
      initialValue: 'uid',
      testValue: mockData.updatedFormValues.id,
      testId: 'ldap-attribute-preferred-username',
      helpText: 'The list of attributes whose values should be used as the preferred username.',
    });
  });

  it('should render the Attributes Name label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Name',
      initialValue: 'cn',
      testValue: mockData.updatedFormValues.name,
      testId: 'ldap-attribute-name',
      helpText: 'The list of attributes whose values should be used as the display name.',
    });
  });

  it('should render the Attributes Email label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Email',
      testValue: mockData.updatedFormValues.email,
      testId: 'ldap-attribute-email',
      helpText: 'The list of attributes whose values should be used as the email address.',
    });
  });

  it('should render the More options sub heading and CA file label and input element', async () => {
    expect(screen.getByRole('heading', { name: 'More options' })).toBeVisible();

    await verifyIDPFileFields({
      inputLabel: 'CA file',
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyIDPAddAndCancelButtons();
  });
});
