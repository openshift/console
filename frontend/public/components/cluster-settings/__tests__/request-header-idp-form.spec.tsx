import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import {
  verifyInputField,
  verifyAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
} from './testUtils';
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
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'request-header',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the URLs sub heading', () => {
    expect(screen.getByRole('heading', { name: 'URLs' })).toBeVisible();
    expect(screen.getByText('At least one URL must be provided.')).toBeVisible();
  });

  it('should render the Challenge URL label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Challenge URL',
      inputType: 'url',
      helpText:
        'The URL to redirect unauthenticated requests from OAuth clients which expect interactive logins.',
    });
  });

  it('should render the Login URL label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Login URL',
      inputType: 'url',
      helpText:
        'The URL to redirect unauthenticated requests from OAuth clients which expect WWW-Authenticate challenges.',
    });
  });

  it('should render the More options sub heading', () => {
    expect(screen.getByRole('heading', { name: 'More options' })).toBeVisible();
  });

  it('should render the CA file label and fields', () => {
    verifyInputField({
      inputLabel: 'CA file',
      containerId: 'ca-file-input-text',
    });

    verifyInputField({
      inputLabel: 'Browse...',
      containerId: 'ca-file-input-file',
      inputType: 'file',
    });

    expect(screen.getByRole('textbox', { name: 'CA file Content' })).toBeVisible();
  });

  it('should render the Client common names label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Client common names',
      helpText: 'The set of common names to require a match from.',
    });
  });

  it('should render the Headers label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Headers',
      helpText: 'The set of headers to check for identity information.',
      isRequired: true,
    });
  });

  it('should render the Preferred username headers label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Preferred username headers',
      helpText: 'The set of headers to check for the preferred username.',
    });
  });

  it('should render the Name headers label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Name headers',
      helpText: 'The set of headers to check for the display name.',
    });
  });

  it('should render the Email headers label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Email headers',
      helpText: 'The set of headers to check for the email address.',
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyAddAndCancelButtons();
  });
});
