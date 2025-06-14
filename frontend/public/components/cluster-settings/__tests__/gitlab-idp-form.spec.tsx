import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import {
  verifyFormField,
  controlButtonTest,
  verifyPageTitleAndSubtitle,
  verifyInputPasswordField,
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
    verifyFormField({
      labelText: 'Name',
      inputRole: 'textbox',
      inputName: 'Name',
      inputValue: 'gitlab',
      inputId: 'idp-name',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the URL label, input field, and help text', () => {
    verifyFormField({
      labelText: 'URL',
      inputRole: 'textbox',
      inputName: 'URL',
      inputValue: '',
      inputId: 'url',
      helpText: 'The OAuth server base URL.',
      isRequired: true,
    });
  });

  it('should render the Client ID label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Client ID',
      inputRole: 'textbox',
      inputName: 'Client ID',
      inputValue: '',
      inputId: 'client-id',
      helpText: '',
      isRequired: true,
    });
  });

  it('should render the Client Secret label and input password field', () => {
    verifyInputPasswordField({
      labelText: 'Client secret',
      inputId: 'client-secret',
      isRequired: true,
    });
  });

  it('should render the CA file label and fields', () => {
    verifyFormField({
      labelText: 'CA file',
      inputRole: 'textbox',
      inputName: 'CA file',
      inputValue: '',
      inputId: 'ca-file-input',
      helpText: '',
    });

    // Verify the Browse button is rendered
    expect(screen.getByText('Browse...')).toBeVisible();

    // Verify the textarea is rendered with the correct aria-label
    expect(screen.getByLabelText('CA file')).toBeVisible();
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest();
  });
});
