import '@testing-library/jest-dom';
import {
  verifyInputField,
  verifyIDPAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
  verifyIDPFileFields,
  mockData,
  setupFileReaderMock,
} from './test-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { AddGitLabPage } from '../../cluster-settings/gitlab-idp-form';

describe('Add Identity Provider: GitLab', () => {
  beforeEach(() => {
    renderWithProviders(<AddGitLabPage />);
  });

  beforeAll(() => {
    setupFileReaderMock();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: GitLab',
      subtitle: 'You can use GitLab integration for users authenticating with GitLab credentials.',
    });
  });

  it('should render the Name label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'gitlab',
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
      helpText: 'The OAuth server base URL.',
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

  it('should render the CA file label and elements', () => {
    verifyIDPFileFields({
      inputLabel: 'CA file',
      idPrefix: 'ca-file-input',
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyIDPAddAndCancelButtons();
  });
});
