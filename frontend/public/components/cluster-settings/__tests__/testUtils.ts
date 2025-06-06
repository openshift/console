import '@testing-library/jest-dom';
import { screen, within, BoundFunctions, Queries } from '@testing-library/react';

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
  expect(screen.getByText(subtitle)).toBeVisible();
};

/**
 * A reusable function to verify an input field with optional container scoping.
 * @param inputLabel - The label text associated with the input field.
 * @param inputType - The type of the input field (default is 'text').
 * @param containerId - The ID of the container to scope the search (optional).
 * @param initialValue - The initial value of the input field (optional).
 * @param helpText - The expected help text associated with the input field (optional).
 * @param isRequired - Whether the input field is required (default is false).
 */
export const verifyInputField = ({
  inputLabel,
  inputType = 'text',
  containerId,
  initialValue = '',
  helpText = '',
  isRequired = false,
}: {
  inputLabel: string;
  inputType?: string;
  containerId?: string;
  initialValue?: string;
  helpText?: string;
  isRequired?: boolean;
}) => {
  // A query variable that scope the queries to that container, which defaults to the global 'screen' object if a container ID is provided.
  let container: BoundFunctions<Queries> | typeof screen = screen;

  if (containerId) {
    const containerElement = screen.getByTestId(containerId);
    expect(containerElement).toBeInTheDocument();
    container = within(containerElement);
  }

  // Query the input element by its associated label text
  const input = container.getByLabelText(inputLabel);

  // Verify the label is visible
  expect(input).toBeVisible();

  // Verify the input field has a default value
  expect(input).toHaveValue(initialValue);

  // Verify that the retrieved element has the 'type' attribute set correctly
  expect(input).toHaveAttribute('type', inputType);

  // Verify the input field is required
  isRequired ? expect(input).toBeRequired() : expect(input).not.toBeRequired();

  // Verify the help text is visible
  if (helpText) {
    expect(container.getByText(helpText)).toBeVisible();
  }
};

// Verifies the visibility of Add and Cancel buttons.
export const verifyAddAndCancelButtons = () => {
  const addButton = screen.getByRole('button', { name: 'Add' });
  const cancelButton = screen.getByRole('button', { name: 'Cancel' });

  expect(addButton).toBeVisible();
  expect(cancelButton).toBeVisible();
};

/**
 * Verifies CA file input components (filename field, browse button, and content textarea).
 * @param inputLabel - The label text associated with the input field.
 * @param idPrefix - The ID prefix for the CA file components (e.g., 'ca-file-input').
 * @param isRequired - Whether the CA file field should be required (default is false).
 * @param helpText - The expected help text associated with the field (optional).
 */
export const verifyIDPFileFields = ({
  inputLabel,
  idPrefix,
  isRequired = false,
  helpText,
}: {
  inputLabel: string;
  idPrefix?: string;
  isRequired?: boolean;
  helpText?: string;
}) => {
  // Verify filename input field
  expect(screen.getByLabelText(`${inputLabel} filename`)).toBeVisible();

  // Verify browse button within its container
  const browseContainer = screen.getByTestId(`${idPrefix}-file`);
  expect(browseContainer).toBeInTheDocument();
  expect(within(browseContainer).getByLabelText('Browse...')).toBeVisible();

  // Verify CA file content field
  const contentField = screen.getByLabelText(inputLabel);
  expect(contentField).toBeVisible();

  // Verify required status
  isRequired ? expect(contentField).toBeRequired() : expect(contentField).not.toBeRequired();

  // Verify help text if provided
  if (helpText) {
    expect(screen.getByText(helpText)).toBeVisible();
  }
};
