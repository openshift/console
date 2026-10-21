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
import { AddRequestHeaderPage } from '../../cluster-settings/request-header-idp-form';

describe('Add Identity Provider: Request Header', () => {
  beforeAll(() => {
    setupFileReaderMock();
  });

  beforeEach(async () => {
    await act(async () => {
      renderWithProviders(<AddRequestHeaderPage />);
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
      title: 'Add Identity Provider: Request Header',
      subtitle:
        'Use request header to identify users from request header values. It is typically used in combination with an authenticating proxy, which sets the request header value.',
    });
  });

  it('should render the Name label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'request-header',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the URLs sub heading', () => {
    expect(screen.getByRole('heading', { name: 'URLs' })).toBeVisible();
    expect(screen.getByText('At least one URL must be provided.')).toBeVisible();
  });

  it('should render the Challenge URL label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Challenge URL',
      inputType: 'url',
      testValue: mockData.updatedFormValues.url,
      helpText:
        'The URL to redirect unauthenticated requests from OAuth clients which expect interactive logins.',
    });
  });

  it('should render the Login URL label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Login URL',
      inputType: 'url',
      testValue: mockData.updatedFormValues.url,
      helpText:
        'The URL to redirect unauthenticated requests from OAuth clients which expect WWW-Authenticate challenges.',
    });
  });

  it('should render the More options sub heading', () => {
    expect(screen.getByRole('heading', { name: 'More options' })).toBeVisible();
  });

  it('should render the More options sub heading and CA file label and input element', async () => {
    expect(screen.getByRole('heading', { name: 'More options' })).toBeVisible();
    await verifyIDPFileFields({
      inputLabel: 'CA file',
    });
  });

  it('should render the Client common names label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Client common names',
      testValue: mockData.updatedFormValues.name,
      testId: 'request-header-client-common-names',
      helpText: 'The set of common names to require a match from.',
    });
  });

  it('should render the Headers label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Headers',
      testValue: mockData.updatedFormValues.headers,
      testId: 'request-header-headers',
      helpText: 'The set of headers to check for identity information.',
      isRequired: true,
    });
  });

  it('should render the Preferred username headers label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Preferred username headers',
      testValue: mockData.updatedFormValues.name,
      testId: 'request-header-preferred-username-headers',
      helpText: 'The set of headers to check for the preferred username.',
    });
  });

  it('should render the Name headers label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Name headers',
      testValue: mockData.updatedFormValues.headers,
      testId: 'request-header-name-headers',
      helpText: 'The set of headers to check for the display name.',
    });
  });

  it('should render the Email headers label, input element, and help text', () => {
    verifyIDPListInputFields({
      inputLabel: 'Email headers',
      testValue: mockData.updatedFormValues.email,
      testId: 'request-header-email-headers',
      helpText: 'The set of headers to check for the email address.',
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyIDPAddAndCancelButtons();
  });
});
