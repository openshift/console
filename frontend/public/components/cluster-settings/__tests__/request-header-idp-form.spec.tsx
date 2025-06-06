import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { verifyFormField, controlButtonTest, verifyPageTitleAndSubtitle } from './testUtils';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import { AddRequestHeaderPage } from '../../cluster-settings/request-header-idp-form';

describe('Add Identity Provider: Request Header', () => {
  beforeEach(() => {
    renderWithProviders(<AddRequestHeaderPage />);
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: Request Header',
      subtitle:
        'Use request header to identify users from request header values. It is typically used in combination with an authenticating proxy, which sets the request header value.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Name',
      inputRole: 'textbox',
      inputName: 'Name',
      inputValue: 'request-header',
      inputId: 'idp-name',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the URLs sub heading', () => {
    expect(screen.getByRole('heading', { name: 'URLs' })).toBeVisible();
    expect(screen.getByText('At least one URL must be provided.')).toBeVisible();
  });

  it('should render the Challenge URL label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Challenge URL',
      inputRole: 'textbox',
      inputName: 'Challenge URL',
      inputValue: '',
      inputId: 'challenge-url',
      helpText:
        'The URL to redirect unauthenticated requests from OAuth clients which expect interactive logins.',
    });
  });

  it('should render the Login URL label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Login URL',
      inputRole: 'textbox',
      inputName: 'Login URL',
      inputValue: '',
      inputId: 'login-url',
      helpText:
        'The URL to redirect unauthenticated requests from OAuth clients which expect WWW-Authenticate challenges.',
    });
  });

  it('should render the More options sub heading', () => {
    expect(screen.getByRole('heading', { name: 'More options' })).toBeVisible();
  });

  it('should render the CA file label and input field', () => {
    verifyFormField({
      labelText: 'CA file',
      inputRole: 'textbox',
      inputName: 'CA file',
      inputValue: '',
      inputId: 'ca-file-input',
      helpText: '',
      isRequired: true,
    });
    // Verify the Browse button is rendered
    const browseButton = screen.getByText('Browse...');
    expect(browseButton).toBeVisible();

    // Verify the textarea is rendered with the correct attribute
    expect(screen.getByLabelText('CA file')).toBeVisible();
  });

  it('should render the Client common names label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Client common names',
      inputRole: 'textbox',
      inputName: 'Client common names',
      inputValue: '',
      inputId: 'list-input',
      helpText: 'The set of common names to require a match from.',
    });
  });

  it('should render the Headers label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Headers',
      inputRole: 'textbox',
      inputName: 'Headers',
      inputValue: '',
      inputId: 'list-input',
      helpText: 'The set of headers to check for identity information.',
      isRequired: true,
    });
  });

  it('should render the Preferred username headers label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Preferred username headers',
      inputRole: 'textbox',
      inputName: 'Preferred username headers',
      inputValue: '',
      inputId: 'list-input',
      helpText: 'The set of headers to check for the preferred username.',
    });
  });

  it('should render the Name headers label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Name headers',
      inputRole: 'textbox',
      inputName: 'Name headers',
      inputValue: '',
      inputId: 'list-input',
      helpText: 'The set of headers to check for the display name.',
    });
  });

  it('should render the Email headers label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Email headers',
      inputRole: 'textbox',
      inputName: 'Email headers',
      inputValue: '',
      inputId: 'list-input',
      helpText: 'The set of headers to check for the email address.',
    });
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest();
  });
});
