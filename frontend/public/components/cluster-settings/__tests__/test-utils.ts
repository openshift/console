// Reusable test utilities for Identity Provider (IDP) form components
import { screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { verifyFormElementBasics } from '@console/shared/src/test-utils/unit-test-utils';

// Mock the cluster-settings module to prevent async API calls during tests
jest.mock('../../cluster-settings', () => ({
  getOAuthResource: jest.fn(() => Promise.resolve({ spec: { identityProviders: [] } })),
  addIDP: jest.fn(() => Promise.resolve({})),
  redirectToOAuthPage: jest.fn(),
  mockNames: {
    secret: 'secret-name',
    ca: 'ca-name',
  },
}));

// Mock k8s module to prevent API calls
jest.mock('../../../module/k8s', () => ({
  ...jest.requireActual('../../../module/k8s'),
  k8sCreate: jest.fn(() => Promise.resolve({ metadata: { name: 'test-secret' } })),
  k8sGet: jest.fn(() => Promise.resolve({ spec: { identityProviders: [] } })),
  k8sPatch: jest.fn(() => Promise.resolve({})),
}));

const updatedFormValues = {
  id: '2729292624425',
  name: 'example',
  username: 'example-username',
  email: 'example@example.com',
  secret: 'test-secret-123', // notsecret
  url: 'http://www.example.com',
  domain: 'www.example.com',
  headers: 'example-headers',
  updatedValue: 'example-updated-value',
};

const testPemFileContent = `
-----BEGIN CERTIFICATE-----
MIIEczCCA1ugAwIBAgIBADANBgkqhkiG9w0BAQQFAD..AkGA1UEBhMCR0Ix
EzARBgNVBAgTClNvbWUtU3RhdGUxFDASBgNVBAoTC0..0EgTHRkMTcwNQYD
BMAV7Gzdc4VspS6ljrAhbiiawdBiQlQmsBeFz9JkF4..b3l8BoGN+qMa56Y
It8una2gY4l2O//on88r5IWJlm1L0oA8e4fR2yrBHX..adsGeFKkyNrwGi/
7vQMfXdGsRrXNGRGnX+vWDZ3/zWI0joDtCkNnqEpVn..HoX
-----END CERTIFICATE-----
`; // notsecret

const testHtpasswdFileContent = 'username:$apr1$.FLGv/xL$Vxl77drYsCi6AsTCySW.b0'; // notsecret

export const mockData = {
  updatedFormValues,
  testPemFileContent,
  testHtpasswdFileContent,
};

// The FileReader mock prevents async operations for file upload testing
export const setupFileReaderMock = () => {
  return jest.spyOn(global, 'FileReader').mockImplementation(
    (): FileReader => {
      const mockFileReader: Partial<FileReader> = {
        readAsText: jest.fn(),
        readAsArrayBuffer: jest.fn(function (this: FileReader) {
          // Simulate the file reading process synchronously
          // Create a mock ArrayBuffer with some dummy data
          const arrayBuffer = new ArrayBuffer(8);
          (this as { result: ArrayBuffer }).result = arrayBuffer;
          // Trigger the onload event immediately if it exists
          if (this.onload) {
            this.onload({} as ProgressEvent<FileReader>);
          }
        }),
        readyState: 0,
        result: null,
        error: null,
        onabort: null,
        onerror: null,
        onload: null,
        onloadend: null,
        onloadstart: null,
        onprogress: null,
        abort: jest.fn(),
        readAsBinaryString: jest.fn(),
        readAsDataURL: jest.fn(),
        DONE: 2,
        EMPTY: 0,
        LOADING: 1,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(() => true),
      };
      return mockFileReader as FileReader;
    },
  );
};

/**
 * Verifies page title and subtitle.
 * @param title - The title text for the page.
 * @param subtitle - The subtitle text for the page.
 */
export const verifyPageTitleAndSubtitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => {
  // Verify the page title
  expect(
    screen.getByRole('heading', {
      name: title,
    }),
  ).toBeVisible();

  // Verify the page subtitle
  if (subtitle) {
    expect(screen.getByText(subtitle)).toBeVisible();
  }
};

// Verifies file input UI elements and test file upload selection functionality and filename verifications.
export const verifyIDPFileFields = async ({
  inputLabel,
  helpText,
  fileName = 'test-idp.pem',
  fileContent = mockData.testPemFileContent,
}: {
  inputLabel: string;
  helpText?: string;
  fileName?: string;
  fileContent?: string;
}) => {
  const user = userEvent.setup();

  // Wait for the async component to load and find the filename input by its aria-label
  const filenameInput = await screen.findByLabelText(`${inputLabel} filename`);
  verifyFormElementBasics(filenameInput, 'text', '');

  // Find the file upload container by traversing up from the filename input
  const fileUploadContainer = filenameInput.closest('.pf-v6-c-file-upload');
  expect(fileUploadContainer).toBeInTheDocument();

  // Verify browse button is visible within the container
  const browseButton = within(fileUploadContainer as HTMLElement).getByRole('button', {
    name: 'Browse...',
  });
  expect(browseButton).toBeVisible();

  // Find the hidden file input element within the container
  const fileInput = fileUploadContainer.querySelector('input[type="file"]') as HTMLInputElement;
  expect(fileInput).toBeTruthy();

  // Verify help text if provided - in PF FileUpload, this is the placeholder attribute
  if (helpText) {
    expect(filenameInput).toHaveAttribute('placeholder', helpText);
  }

  // Create a simple file with the provided content and name
  const file = new File([fileContent], fileName, { type: 'text/plain' });

  // Simulate user selecting a file
  await user.upload(fileInput, file);

  // Verify the file was properly selected and assigned to the input element
  expect(fileInput.files).toBeTruthy();
  expect(fileInput.files?.length).toBe(1);
  expect(fileInput.files?.[0]).toBe(file);
  expect(fileInput.files?.[0]?.name).toBe(fileName);
};

/**
 * Verifies ListInput component UI structure and interactions.
 * @param inputLabel - The label text for the input elements
 * @param testId - The data-test of the ListInput container
 * @param initialValue - The initial value of the input element (optional).
 * @param testValue - Value to enter in the input element for testing (optional)
 * @param helpText - The expected help text for the input group (optional)
 * @param isRequired - Whether the first input element should be required (optional)
 */
export const verifyIDPListInputFields = ({
  inputLabel,
  testId,
  initialValue = '',
  testValue = 'test-value',
  helpText,
  isRequired = false,
}: {
  inputLabel: string;
  testId: string;
  initialValue?: string;
  helpText?: string;
  testValue?: string;
  isRequired?: boolean;
}) => {
  const listInputContainer = screen.getByTestId(testId);
  expect(listInputContainer).toBeInTheDocument();

  const initialInputFields = within(listInputContainer).getAllByLabelText(inputLabel);
  // Verify at least one input element exists initially
  expect(initialInputFields.length).toEqual(1);

  verifyFormElementBasics(initialInputFields[0], 'text', initialValue, isRequired);

  // Verify help text if provided
  if (helpText) {
    expect(within(listInputContainer).getByText(helpText)).toBeVisible();
  }

  // Test input element functionality by entering a value
  fireEvent.change(initialInputFields[0], { target: { value: testValue } });
  expect(initialInputFields[0]).toHaveValue(testValue);

  const addMoreButton = within(listInputContainer).getByRole('button', { name: 'Add more' });
  verifyFormElementBasics(addMoreButton, 'button');

  // Click "Add more" and verify length increases
  fireEvent.click(addMoreButton);
  const updatedInputFields = within(listInputContainer).getAllByLabelText(inputLabel);

  expect(updatedInputFields.length).toBe(initialInputFields.length + 1);

  // Verify the new element is empty and functional
  const newField = updatedInputFields[updatedInputFields.length - 1];
  expect(newField).toHaveValue('');
  expect(newField).toBeVisible();

  // Test the new element by entering a value
  const newTestValue = `${testValue}-2`;
  fireEvent.change(newField, { target: { value: newTestValue } });
  expect(newField).toHaveValue(newTestValue);

  // Verify remove buttons exist for all elements
  const removeButtons = within(listInputContainer).getAllByRole('button', { name: 'Remove' });
  expect(removeButtons.length).toBe(updatedInputFields.length);
  verifyFormElementBasics(removeButtons[0], 'button');

  // Click remove button and verify length decreases
  fireEvent.click(removeButtons[0]);
  const finalInputFields = within(listInputContainer).getAllByLabelText(inputLabel);
  expect(finalInputFields.length).toBe(updatedInputFields.length - 1);
};

// Verifies the visibility of Add and Cancel buttons.
export const verifyIDPAddAndCancelButtons = () => {
  const addButton = screen.getByRole('button', { name: 'Add' });
  const cancelButton = screen.getByRole('button', { name: 'Cancel' });

  expect(addButton).toBeVisible();
  expect(cancelButton).toBeVisible();
};
