import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import {
  verifyFormField,
  controlButtonTest,
  verifyInputPasswordField,
  verifyPageTitleAndSubtitle,
  verifyListInput,
} from './testUtils';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import { AddOpenIDIDPPage } from '../../cluster-settings/openid-idp-form';

describe('Add Identity Provider: OpenID Connect', () => {
  beforeEach(() => {
    renderWithProviders(<AddOpenIDIDPPage />);
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: OpenID Connect',
      subtitle:
        'Integrate with an OpenID Connect identity provider using an Authorization Code Flow.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    const labelText = 'Name';
    const inputRole = 'textbox';
    const inputName = 'Name';
    const inputValue = 'openid';
    const inputId = 'idp-name';
    const helpText = 'Unique name of the new identity provider. This cannot be changed later.';

    const section = screen.getByTestId('idp-name-form-group');
    const label = within(section).getByText(labelText, { exact: true });
    expect(label).toBeVisible();

    // Verify the label is associated with the correct input field
    expect(label).toHaveAttribute('for', inputId);

    // Verify the input field
    // TODO: Clean up later on
    const input = within(section).getByRole(inputRole, { name: inputName, exact: true });
    expect(input).toBeVisible();
    expect(input).toHaveValue(inputValue);

    // Verify the help text
    if (helpText) {
      expect(screen.getByText(helpText)).toBeVisible();
    }
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

  it('should render the Issuer URL label and fields', () => {
    verifyFormField({
      labelText: 'Issuer URL',
      inputRole: 'textbox',
      inputName: 'Issuer URL',
      inputValue: '',
      inputId: 'issuer',
      helpText:
        'The URL that the OpenID provider asserts as its issuer identifier. It must use the https scheme with no URL query parameters or fragment.',
      isRequired: true,
    });
  });

  it('should render the Claims sub heading abd text', () => {
    const section = screen.getByTestId('openid-list-input');
    expect(section).toBeVisible();
    const title = screen.getByRole('heading', { name: 'Claims' });
    expect(title).toBeVisible();
    const description = screen.getByText(
      'Claims map metadata from the OpenID provider to an OpenShift user. The first non-empty claim is used.',
    );
    expect(description).toBeVisible();
  });

  it('should render the Preferred username label, input field, and help text', () => {
    verifyListInput({
      labelText: 'Preferred username',
      inputId: 'openid-list-input',
      inputValue: 'preferred_username',
      helpText: 'Any scopes to request in addition to the standard openid scope.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    verifyListInput({
      labelText: 'Name',
      inputId: 'openid-list-input',
      inputValue: 'name',
      helpText: 'The list of claims whose values should be used as the display name.',
    });
  });

  it('should render the Email label, input field, and help text', () => {
    verifyListInput({
      labelText: 'Email',
      inputId: 'openid-list-input',
      inputValue: 'email',
      helpText: 'The list of claims whose values should be used as the email address.',
    });
  });

  it('should render the More options sub heading', () => {
    const section = screen.getByTestId('openid-list-input'); // Fix this
    expect(section).toBeVisible();
    const title = screen.getByRole('heading', { name: 'More options' });
    expect(title).toBeVisible();
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

  it('should render the Extra scopes label, input field, and help text', () => {
    verifyListInput({
      labelText: 'Extra scopes',
      inputId: 'openid-list-input',
      inputValue: '',
      helpText: 'Any scopes to request in addition to the standard openid scope.',
      isRequired: false,
    });
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest();
  });
});
