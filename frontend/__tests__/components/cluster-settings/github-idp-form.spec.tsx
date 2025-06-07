import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { AddGitHubPage } from '../../../public/components/cluster-settings/github-idp-form';
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
    });
  });

  it('should render the Client Secret label and input password field', () => {
    verifyInputPasswordField({
      labelText: 'Client secret',
      inputForId: 'client-secret',
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

  it('should render the title, description, and ListInput component', () => {
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Teams' })).toBeVisible();
    // TODO: Add tests for ListInput component and <Trans> component contents
  });

  // TODO: Add the test later on.
  // it('should render the form elements of AddGitHubPage component', () => {
  //   expect(wrapper.find('input[id="client-secret"]').exists()).toBe(true);
  //   expect(wrapper.find(ListInput).length).toEqual(2);
  // });

  it("should render 'Add' and 'Cancel' buttons in a button bar", () => {
    controlButtonTest();
  });
});
