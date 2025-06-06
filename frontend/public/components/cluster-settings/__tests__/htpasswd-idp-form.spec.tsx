import '@testing-library/jest-dom';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import {
  verifyInputField,
  verifyAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
} from './testUtils';
import { AddHTPasswdPage } from '../../cluster-settings/htpasswd-idp-form';

describe('Add Identity Provider: HTPasswd', () => {
  beforeEach(() => {
    renderWithProviders(<AddHTPasswdPage />);
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: HTPasswd',
      subtitle:
        'HTPasswd validates usernames and passwords against a flat file generated using the htpasswd command.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'htpasswd',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the HTPasswd file file label and fields', () => {
    verifyInputField({
      inputLabel: 'HTPasswd file filename',
    });

    verifyInputField({
      inputLabel: 'Browse...',
      inputType: 'file',
      helpText: 'Upload an HTPasswd file created using the htpasswd command.',
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyAddAndCancelButtons();
  });
});
