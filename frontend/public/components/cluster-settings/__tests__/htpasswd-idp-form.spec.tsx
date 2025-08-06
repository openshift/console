import '@testing-library/jest-dom';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  verifyInputField,
  verifyIDPAddAndCancelButtons,
  verifyPageTitleAndSubtitle,
  verifyIDPFileFields,
  mockData,
  setupFileReaderMock,
} from './test-utils';
import { AddHTPasswdPage } from '../../cluster-settings/htpasswd-idp-form';

describe('Add Identity Provider: HTPasswd', () => {
  beforeEach(() => {
    renderWithProviders(<AddHTPasswdPage />);
  });

  beforeAll(() => {
    setupFileReaderMock();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should render page title and sub title', () => {
    verifyPageTitleAndSubtitle({
      title: 'Add Identity Provider: HTPasswd',
      subtitle:
        'HTPasswd validates usernames and passwords against a flat file generated using the htpasswd command.',
    });
  });

  it('should render the Name label, input element, and help text', () => {
    verifyInputField({
      inputLabel: 'Name',
      initialValue: 'htpasswd',
      testValue: mockData.updatedFormValues.name,
      helpText: 'Unique name of the new identity provider. This cannot be changed later.',
      isRequired: true,
    });
  });

  it('should render the HTPasswd file file label and elements', () => {
    verifyIDPFileFields({
      inputLabel: 'HTPasswd file',
      idPrefix: 'htpasswd-file',
      helpText: 'Upload an HTPasswd file created using the htpasswd command.',
      isRequired: true,
      fileName: 'example.htpasswd',
      fileContent: mockData.testHtpasswdFileContent,
    });
  });

  it('should render control buttons in a button bar', () => {
    verifyIDPAddAndCancelButtons();
  });
});
