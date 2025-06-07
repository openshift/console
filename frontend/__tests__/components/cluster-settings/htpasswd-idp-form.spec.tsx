import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import { verifyFormField, controlButtonTest, verifyPageTitleAndSubtitle } from './testUtils';
import { AddHTPasswdPage } from '../../../public/components/cluster-settings/htpasswd-idp-form';

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
    verifyFormField({
      labelText: 'Name',
      inputRole: 'textbox',
      inputName: 'Name',
      inputValue: 'htpasswd',
      inputId: 'idp-name',
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
    });
  });

  it('should render the HTPasswd file file label and fields', () => {
    verifyFormField({
      labelText: 'HTPasswd file',
      inputRole: 'textbox',
      inputName: 'HTPasswd file',
      inputValue: '',
      inputId: 'htpasswd-file', // TODO: Use prefer query instead of ID
      helpText: 'Upload an HTPasswd file created using the htpasswd command.',
    });

    // Verify the Browse button is rendered
    expect(screen.getByText('Browse...')).toBeVisible();

    // Verify the textarea is rendered with the correct aria-label
    expect(screen.getByLabelText('HTPasswd file')).toBeVisible();
  });
  it('should render control buttons in a button bar', () => {
    controlButtonTest();
  });
});
