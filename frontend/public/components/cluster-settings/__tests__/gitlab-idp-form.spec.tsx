import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import {
  verifyInputField,
  verifyAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
} from './testUtils';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import { AddGitLabPage } from '../../cluster-settings/gitlab-idp-form';

describe('Add Identity Provider: GitLab', () => {
  beforeEach(() => {
    renderWithProviders(<AddGitLabPage />);
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: GitLab',
      subtitle: 'You can use GitLab integration for users authenticating with GitLab credentials.',
    });
  });
  it('should render the Name label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'gitlab',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the URL label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'URL',
      inputType: 'url',
      helpText: 'The OAuth server base URL.',
      isRequired: true,
    });
  });

  it('should render the Client ID label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Client ID',
      isRequired: true,
    });
  });

  it('should render the Client Secret label and input password field', () => {
    verifyInputField({
      inputLabel: 'Client secret',
      inputType: 'password',
      isRequired: true,
    });
  });

  it('should render the CA file label and fields', () => {
    verifyInputField({
      inputLabel: 'CA file filename',
      containerId: 'ca-file-input-text',
    });

    verifyInputField({
      inputLabel: 'Browse...',
      containerId: 'ca-file-input-file',
      inputType: 'file',
    });

    expect(screen.getByRole('textbox', { name: 'CA file' })).toBeVisible();
  });

  it('should render control buttons in a button bar', () => {
    verifyAddAndCancelButtons();
  });
});
