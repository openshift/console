import '@testing-library/jest-dom';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import {
  verifyFormField,
  controlButtonTest,
  verifyPageTitleAndSubtitle,
  verifyInputPasswordField,
} from './testUtils';
import { AddGooglePage } from '../../cluster-settings/google-idp-form';

describe('Add Identity Provider: Google', () => {
  beforeEach(() => {
    renderWithProviders(<AddGooglePage />);
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: Google',
      subtitle: 'You can use Google integration for users authenticating with Google credentials.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Name',
      inputRole: 'textbox',
      inputName: 'Name',
      inputValue: 'google',
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

  it('should render the Hosted Domain label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Hosted domain',
      inputRole: 'textbox',
      inputName: 'Hosted domain',
      inputValue: '',
      inputId: 'hosted-domain',
      helpText: 'Restrict users to a Google App domain.',
      isRequired: true,
    });
  });

  it('should render control buttons in a button bar', () => {
    controlButtonTest();
  });
});
