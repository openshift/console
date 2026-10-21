import { cleanup, screen, act } from '@testing-library/react';
import { AddGitHubPage } from '../../cluster-settings/github-idp-form';
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

describe('Add Identity Provider: GitHub', () => {
  beforeAll(() => {
    setupFileReaderMock();
  });

  beforeEach(async () => {
    await act(async () => {
      renderWithProviders(<AddGitHubPage />);
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
      title: 'Add Identity Provider: GitHub',
      subtitle:
        'You can use the GitHub integration to connect to either GitHub or GitHub Enterprise. For GitHub Enterprise, you must provide the hostname of your instance and can optionally provide a CA certificate bundle to use in requests to the server.',
    });
  });

  it('should render the Name label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'github',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the Client ID label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Client ID',
      testValue: mockData.updatedFormValues.id,
      isRequired: true,
    });
  });

  it('should render the Client Secret label and input password element', () => {
    verifyInputField({
      inputLabel: 'Client secret',
      inputType: 'password',
      testValue: mockData.updatedFormValues.secret,
      isRequired: true,
    });
  });

  it('should render the Hostname label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Hostname',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Optional domain for use with a hosted instance of GitHub Enterprise.',
    });
  });

  it('should render the CA file label and elements, and verify upload file selection', async () => {
    await verifyIDPFileFields({
      inputLabel: 'CA file',
      fileName: 'ca-certificate.pem',
      fileContent: 'test certificate content',
    });
  });

  it('should render the Organizations sub heading and input element', () => {
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeVisible();

    // Verify the text content
    expect(
      screen.getByText(
        /Optionally list organizations. If specified, only GitHub users that are members of at least one of the listed organizations will be allowed to log in. Cannot be used in combination with/i,
      ),
    ).toBeVisible();

    // Verify the <strong> element
    const strongElement = screen.getByText('organizations');
    expect(strongElement).toBeVisible();
    expect(strongElement.tagName).toBe('STRONG');

    verifyIDPListInputFields({
      inputLabel: 'Organization',
      testValue: 'Example organization',
      testId: 'organization-list-input',
      helpText: 'Restricts which organizations are allowed to log in.',
    });
  });

  it('should render the Teams sub heading', () => {
    expect(screen.getByRole('heading', { name: 'Teams' })).toBeVisible();

    // Verify the text content
    expect(
      screen.getByText(
        /Optionally list teams. If specified, only GitHub users that are members of at least one of the listed teams will be allowed to log in. Cannot be used in combination with/i,
      ),
    ).toBeVisible();

    // Verify the <strong> element
    const strongElement = screen.getByText('teams');
    expect(strongElement).toBeVisible();
    expect(strongElement.tagName).toBe('STRONG');

    verifyIDPListInputFields({
      inputLabel: 'Team',
      testValue: 'Example team',
      testId: 'team-list-input',
      helpText: 'Restricts which teams are allowed to log in. The format is <org>/<team>.',
    });
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    verifyIDPAddAndCancelButtons();
  });
});
