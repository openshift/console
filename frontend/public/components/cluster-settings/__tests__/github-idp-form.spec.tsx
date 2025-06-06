import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { AddGitHubPage } from '../../cluster-settings/github-idp-form';
import {
  verifyFormField,
  controlButtonTest,
  verifyInputPasswordField,
  verifyPageTitleAndSubtitle,
} from './testUtils';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';

describe('Add Identity Provider: GitHub', () => {
  beforeEach(() => {
    renderWithProviders(<AddGitHubPage />);
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: GitHub',
      subtitle:
        'You can use the GitHub integration to connect to either GitHub or GitHub Enterprise. For GitHub Enterprise, you must provide the hostname of your instance and can optionally provide a CA certificate bundle to use in requests to the server.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Name',
      inputRole: 'textbox',
      inputName: 'Name',
      inputValue: 'github',
      inputId: 'idp-name',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
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

  it('should render the Hostname label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Hostname',
      inputRole: 'textbox',
      inputName: 'Hostname',
      inputValue: '',
      inputId: 'hostname',
      helpText: 'Optional domain for use with a hosted instance of GitHub Enterprise.',
    });
  });

  it('should render the CA file label and input field', () => {
    verifyFormField({
      labelText: 'CA file',
      inputRole: 'textbox',
      inputName: 'CA file',
      inputValue: '',
      inputId: 'ca-file-input',
      helpText: '',
    });

    // Verify the Browse button is rendered
    const browseButton = screen.getByText('Browse...');
    expect(browseButton).toBeVisible();

    // Verify the textarea is rendered with the correct attribute
    expect(screen.getByLabelText('CA file')).toBeVisible();
  });

  it('should render the Organizations sub heading and input field', () => {
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeVisible();

    verifyFormField({
      labelText: 'Organization',
      inputRole: 'textbox',
      inputName: 'Organization',
      inputValue: '',
      inputId: 'list-input',
      helpText: 'Restricts which organizations are allowed to log in.',
    });
  });

  it('should render the Teams sub heading', () => {
    expect(screen.getByRole('heading', { name: 'Teams' })).toBeVisible();

    verifyFormField({
      labelText: 'Team',
      inputRole: 'textbox',
      inputName: 'Team',
      inputValue: '',
      inputId: 'list-input',
      helpText: 'Restricts which teams are allowed to log in. The format is <org>/<team>.',
    });
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    controlButtonTest();
  });
});
