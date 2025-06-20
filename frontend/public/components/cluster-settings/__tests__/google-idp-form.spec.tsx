import '@testing-library/jest-dom';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import {
  verifyInputField,
  verifyAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
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
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'google',
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

  it('should render the Hosted Domain label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Hosted domain',
      helpText: 'Restrict users to a Google App domain.',
      isRequired: true,
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyAddAndCancelButtons();
  });
});
