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
import { AddOpenIDIDPPage } from '../../cluster-settings/openid-idp-form';

describe('Add Identity Provider: OpenID Connect', () => {
  beforeAll(() => {
    setupFileReaderMock();
  });

  beforeEach(async () => {
    await act(async () => {
      renderWithProviders(<AddOpenIDIDPPage />);
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
      title: 'Add Identity Provider: OpenID Connect',
      subtitle:
        'Integrate with an OpenID Connect identity provider using an Authorization Code Flow.',
    });
  });

  it('should render the Name label, input element, and help text', async () => {
    await verifyInputField({
      inputLabel: 'Name',
      initialValue: 'openid',
      containerId: 'idp-name-form',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the Client ID label, input element, and help text', async () => {
    await verifyInputField({
      inputLabel: 'Client ID',
      testValue: mockData.updatedFormValues.id,
      isRequired: true,
    });
  });

  it('should render the Client Secret label and input password element', async () => {
    await verifyInputField({
      inputLabel: 'Client secret',
      inputType: 'password',
      testValue: mockData.updatedFormValues.secret,
      isRequired: true,
    });
  });

  it('should render the Issuer URL label and elements', async () => {
    await verifyInputField({
      inputLabel: 'Issuer URL',
      inputType: 'url',
      testValue: mockData.updatedFormValues.url,
      helpText:
        'The URL that the OpenID provider asserts as its issuer identifier. It must use the https scheme with no URL query parameters or fragment.',
      isRequired: true,
    });
  });

  it('should render the Claims sub heading abd text', () => {
    expect(screen.getByRole('heading', { name: 'Claims' })).toBeVisible();
    expect(
      screen.getByText(
        'Claims map metadata from the OpenID provider to an OpenShift user. The first non-empty claim is used.',
      ),
    ).toBeVisible();
  });

  it('should render the Preferred username label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Preferred username',
      initialValue: 'preferred_username',
      testValue: mockData.updatedFormValues.username,
      testId: 'openid-claims-preferred-username',
      helpText: 'Any scopes to request in addition to the standard openid scope.',
    });
  });

  it('should render the Name label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Name',
      initialValue: 'name',
      testValue: mockData.updatedFormValues.name,
      testId: 'openid-claims-name',
      helpText: 'The list of claims whose values should be used as the display name.',
    });
  });

  it('should render the Email label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Email',
      initialValue: 'email',
      testValue: mockData.updatedFormValues.email,
      testId: 'openid-claims-email',
      helpText: 'The list of claims whose values should be used as the email address.',
    });
  });

  it('should render the More options sub heading and CA file label and input element', async () => {
    expect(screen.getByRole('heading', { name: 'More options' })).toBeVisible();

    await verifyIDPFileFields({
      inputLabel: 'CA file',
    });
  });

  it('should render the Extra scopes label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Extra scopes',
      testValue: mockData.updatedFormValues.updatedValue,
      testId: 'openid-more-options-extra-scopes',
      helpText: 'Any scopes to request in addition to the standard openid scope.',
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyIDPAddAndCancelButtons();
  });
});
