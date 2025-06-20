import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { AddGitHubPage } from '../../cluster-settings/github-idp-form';
import {
  verifyInputField,
  verifyAddAndCancelButtons,
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
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'github',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
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

  it('should render the Hostname label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Hostname',
      helpText: 'Optional domain for use with a hosted instance of GitHub Enterprise.',
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

  it('should render the Organizations sub heading and input field', () => {
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeVisible();

    verifyInputField({
      inputLabel: 'Organization',
      helpText: 'Restricts which organizations are allowed to log in.',
    });
  });

  it('should render the Teams sub heading', () => {
    expect(screen.getByRole('heading', { name: 'Teams' })).toBeVisible();

    verifyInputField({
      inputLabel: 'Team',
      helpText: 'Restricts which teams are allowed to log in. The format is <org>/<team>.',
    });
  });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    verifyAddAndCancelButtons();
  });
});
