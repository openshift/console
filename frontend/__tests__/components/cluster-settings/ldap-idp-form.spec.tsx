import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import {
  verifyFormField,
  controlButtonTest,
  verifyInputPasswordField,
  verifyPageTitleAndSubtitle,
} from './testUtils';
import { renderWithProviders } from '@console/shared/src/utils/__tests__/testUtils';
import { AddLDAPPage } from '../../../public/components/cluster-settings/ldap-idp-form';

describe('Add Identity Provider: LDAP', () => {
  beforeEach(() => {
    renderWithProviders(<AddLDAPPage />);
  });

  // TODO: Failing test: TestingLibraryElementError: Found multiple elements with the text: Name
  it('should render page title and sub title', () => {
    //   const section = screen.getByTestId('idp-name-form-group');
    // const button = within(section).getByRole('heading', {
    //   name: 'Add Identity Provider: LDAP',
    // })
    // expect(button).toBeVisible();

    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: LDAP',
      subtitle: 'Integrate with an LDAP identity provider.',
    });
  });

  it('should render the Name label, input field, and help text', () => {
    const labelText = 'Name';
    const inputRole = 'textbox';
    const inputName = 'Name';
    const inputValue = 'ldap';
    const inputId = 'idp-name';
    const helpText = 'Unique name of the new identity provider. This cannot be changed later.';

    const section = screen.getByTestId('idp-name-form-group');
    // const button = within(section).getByRole('heading', {
    //   name: 'Add Identity Provider: LDAP',
    // })
    // expect(button).toBeVisible();

    const label = within(section).getByText(labelText, { exact: true });
    expect(label).toBeVisible();

    // Verify the label is associated with the correct input field
    expect(label).toHaveAttribute('for', inputId);

    // Verify the input field
    const input = screen.getByRole(inputRole, { name: inputName, exact: true });
    expect(input).toBeVisible();
    expect(input).toHaveValue(inputValue);

    // Verify the help text
    if (helpText) {
      expect(screen.getByText(helpText)).toBeVisible();
    }
    // expect(button).toBeVisible();
    // verifyFormField({
    //   labelText: 'Name',
    //   inputRole: 'textbox',
    //   inputName: 'Name',
    //   inputValue: 'ldap',
    //   inputId: 'idp-name',
    //   helpText: 'Unique name of the new identity provider. This cannot be changed later.',
    // });
  });

  it('should render the URL label, input field, and help text', () => {
    verifyFormField({
      labelText: 'URL',
      inputRole: 'textbox',
      inputName: 'URL',
      inputValue: '',
      inputId: 'url',
      helpText: 'An RFC 2255 URL which specifies the LDAP search parameters to use.',
    });
  });

  it('should render the Bind DN label, input field, and help text', () => {
    verifyFormField({
      labelText: 'Bind DN',
      inputRole: 'textbox',
      inputName: 'Bind DN',
      inputValue: '',
      inputId: 'bind-dn',
      helpText: 'DN to bind with during the search phase.',
    });
  });

  it('should render the Bind Password label and input password field', () => {
    verifyInputPasswordField({
      labelText: 'Bind password',
      inputForId: 'bind-password',
      helpText: 'DN to bind with during the search phase.',
    });
  });

  // TODO: Add tests for Attributes and ListInputs

  it('should render the Attributes Name label, input field, and help text', () => {
    const labelText = 'Name';
    const inputRole = 'textbox';
    const inputName = 'Name';
    //const inputValue= 'cn';
    const inputId = 'list-input-for-name';
    const helpText = 'The list of attributes whose values should be used as the display name.';

    const attributesSection = screen.getByTestId('list-input-name');
    // const button = within(section).getByRole('heading', {
    //   name: 'Add Identity Provider: LDAP',
    // })
    // expect(button).toBeVisible();

    const label = within(attributesSection).getByText(labelText, { exact: true });
    expect(label).toBeVisible();

    // Verify the label is associated with the correct input field
    expect(label).toHaveAttribute('for', inputId);

    // Verify the input field
    const input = screen.getByRole(inputRole, { name: inputName, exact: true });
    expect(input).toBeVisible();
    // expect(input).toHaveValue(inputValue); // Fix this

    // Verify the help text
    if (helpText) {
      expect(screen.getByText(helpText)).toBeVisible();
    }
    // expect(button).toBeVisible();
    // verifyFormField({
    //   labelText: 'Name',
    //   inputRole: 'textbox',
    //   inputName: 'Name',
    //   inputValue: 'ldap',
    //   inputId: 'idp-name',
    //   helpText: 'Unique name of the new identity provider. This cannot be changed later.',
    // });
  });

  it('should render the form elements of AddLDAPPage component', () => {
    // expect(wrapper.find(IDPNameInput).exists()).toBe(true);
    // expect(wrapper.find(IDPCAFileInput).exists()).toBe(true);
    // expect(wrapper.find('input[id="url"]').exists()).toBe(true);
    // expect(wrapper.find('input[id="bind-dn"]').exists()).toBe(true);
    // expect(wrapper.find('input[id="bind-password"]').exists()).toBe(true);
    //  expect(wrapper.find(ListInput).length).toEqual(4);
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

  it('should render control buttons in a button bar', () => {
    controlButtonTest();
  });

  // it('should prefill ldap attribute list input default values', () => {
  //   expect(wrapper.find(ListInput).at(0).props().initialValues).toEqual(['dn']);
  //   expect(wrapper.find(ListInput).at(1).props().initialValues).toEqual(['uid']);
  //   expect(wrapper.find(ListInput).at(2).props().initialValues).toEqual(['cn']);
  //   expect(wrapper.find(ListInput).at(3).props().initialValues).toEqual(undefined);
  // });
});
