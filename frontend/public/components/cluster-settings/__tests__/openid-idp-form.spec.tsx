import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import {
  verifyInputField,
  verifyAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
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
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'openid',
      containerId: 'idp-name-form-group',
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

  it('should render the Issuer URL label and fields', () => {
    verifyInputField({
      inputLabel: 'Issuer URL',
      inputType: 'url',
      helpText:
        'The URL that the OpenID provider asserts as its issuer identifier. It must use the https scheme with no URL query parameters or fragment.',
      isRequired: true,
    });
  });

  it('should render the Claims sub heading abd text', () => {
    const section = screen.getByTestId('openid-claims-list-input');
    expect(section).toBeVisible();
    const title = screen.getByRole('heading', { name: 'Claims' });
    expect(title).toBeVisible();
    const description = screen.getByText(
      'Claims map metadata from the OpenID provider to an OpenShift user. The first non-empty claim is used.',
    );
    expect(description).toBeVisible();
  });

  it('should render the Preferred username label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Preferred username',
      containerId: 'openid-claims-list-input',
      initialValue: 'preferred_username',
      helpText: 'Any scopes to request in addition to the standard openid scope.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      containerId: 'openid-claims-list-input',
      initialValue: 'name',
      helpText: 'The list of claims whose values should be used as the display name.',
    });
  });

  it('should render the Email label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Email',
      initialValue: 'email',
      helpText: 'The list of claims whose values should be used as the email address.',
    });
  });

  it('should render the More options sub heading', () => {
    const section = screen.getByTestId('openid-more-options-list-input');
    expect(section).toBeVisible();
    const title = screen.getByRole('heading', { name: 'More options' });
    expect(title).toBeVisible();
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

  it('should render the Extra scopes label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Extra scopes',
      containerId: 'openid-more-options-list-input',
      helpText: 'Any scopes to request in addition to the standard openid scope.',
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyAddAndCancelButtons();
  });
});
