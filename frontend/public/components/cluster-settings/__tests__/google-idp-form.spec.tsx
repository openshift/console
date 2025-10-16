import { cleanup } from '@testing-library/react';
import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import { verifyIDPAddAndCancelButtons, verifyPageTitleAndSubtitle, mockData } from './test-utils';
import { AddGooglePage } from '../../cluster-settings/google-idp-form';

describe('Add Identity Provider: Google', () => {
  beforeEach(() => {
    renderWithProviders(<AddGooglePage />);
  });

  afterEach(() => {
    cleanup();
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: Google',
      subtitle: 'You can use Google integration for users authenticating with Google credentials.',
    });
  });

  it('should render the Name label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'google',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the Client ID label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Client ID',
      testValue: mockData.updatedFormValues.id,
      isRequired: true,
    });
  });

  it('should render the Client Secret label and input password element', () => {
    verifyInputField({
      inputLabel: 'Client secret',
      inputType: 'password',
      testValue: mockData.updatedFormValues.secret,
      isRequired: true,
    });
  });

  it('should render the Hosted Domain label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Hosted domain',
      testValue: mockData.updatedFormValues.domain,
      helpText: 'Restrict users to a Google App domain.',
      isRequired: true,
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyIDPAddAndCancelButtons();
  });
});
