import { screen } from '@testing-library/react';
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
  const renderPage = async () => {
    renderWithProviders(<AddGitHubPage />);
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
      title: 'Add Identity Provider: GitHub',
      subtitle:
        'You can use the GitHub integration to connect to either GitHub or GitHub Enterprise. For GitHub Enterprise, you must provide the hostname of your instance and can optionally provide a CA certificate bundle to use in requests to the server.',
    });
  });

  it('should render the Name label, input element, and help text', async () => {
    await renderPage();
    await verifyInputField({
      inputLabel: 'Name',
      initialValue: 'github',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the Client ID label, input element, and help text', async () => {
    await renderPage();
    await verifyInputField({
      inputLabel: 'Client ID',
      testValue: mockData.updatedFormValues.id,
      isRequired: true,
    });
  });

  it('should render the Client Secret label and input password element', async () => {
    await renderPage();
    await verifyInputField({
      inputLabel: 'Client secret',
      inputType: 'password',
      testValue: mockData.updatedFormValues.secret,
      isRequired: true,
    });
  });

  it('should render the Hostname label, input element, and help text', async () => {
    await renderPage();
    await verifyInputField({
      inputLabel: 'Hostname',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Optional domain for use with a hosted instance of GitHub Enterprise.',
    });
  });

  it('should render the CA file label and elements, and verify upload file selection', async () => {
    await renderPage();
    await verifyIDPFileFields({
      inputLabel: 'CA file',
      fieldId: 'ca-file-input',
      fileName: 'ca-certificate.pem',
      fileContent: 'test certificate content',
    });
  });

  it('should render the Organizations sub heading and input element', async () => {
    await renderPage();
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

    await verifyIDPListInputFields({
      inputLabel: 'Organization',
      testValue: 'Example organization',
      testId: 'organization-list-input',
      helpText: 'Restricts which organizations are allowed to log in.',
    });
  });

  it('should render the Teams sub heading', async () => {
    await renderPage();
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

    await verifyIDPListInputFields({
      inputLabel: 'Team',
      testValue: 'Example team',
      testId: 'team-list-input',
      helpText: 'Restricts which teams are allowed to log in. The format is <org>/<team>.',
    });
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", async () => {
    await renderPage();
    verifyIDPAddAndCancelButtons();
  });
});
