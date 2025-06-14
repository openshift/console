import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';

/**
 * Helper function to verify the behavior of a ListInput component.
 * @param testId - The test ID of the ListInput section.
 * @param labelText - The label text for the input field.
 * @param expectedValue - The expected value of the input field.
 * @param helpText - The help text associated with the input field.
 * @param isRequired - Whether the input field is required.
 */

/**
 * Helper function to verify the behavior of page title and subtitle.
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
 * Verifies the visibility, correctness, and attributes of a form field.
 * @param labelText - The expected label text for the input field.
 * @param inputRole - The role of the input field (default is 'textbox').
 * @param inputName - The accessible name of the input field.
 * @param inputValue - The expected value of the input field.
 * @param inputId - The unique identifier for the input field.
 * @param helpText - The expected help text associated with the input field.
 * @param isRequired - Whether the input field is required (default is false).
 */
export const verifyFormField = ({
  labelText,
  inputRole = 'textbox',
  inputName,
  inputValue,
  inputId,
  helpText,
  isRequired = false,
}: {
  labelText: string;
  inputRole?: string;
  inputName?: string;
  inputValue?: string;
  inputId: string; // Make it a unique identifier for the input field
  helpText?: string;
  isRequired?: boolean;
}) => {
  // Verify the label
  const label = screen.getByText(labelText);
  expect(label).toBeVisible();

  // Verify the label is associated with the correct input field
  expect(label).toHaveAttribute('for', inputId);

  // Verify the input field
  const input = screen.getByRole(inputRole, { name: inputName });
  expect(input).toBeVisible();
  expect(input).toHaveValue(inputValue);

  // Verify the help text
  if (helpText) {
    expect(screen.getByText(helpText)).toBeVisible();
  }

  // Verify the input field is required
  isRequired ? expect(input).toBeRequired() : expect(input).not.toBeRequired();
};

/**
 * Verifies the visibility, correctness, and attributes of a form field.
 *
 * @param labelText - The expected label text for the input field.
 * @param inputId - The unique identifier for the input field.
 * @param helpText - The expected help text associated with the input field.
 * @param isRequired - Whether the input field is required (default is false).
 */

export const verifyInputPasswordField = ({
  labelText,
  inputId,
  helpText,
  isRequired = false,
}: {
  labelText: string;
  inputId: string;
  helpText?: string;
  isRequired?: boolean;
}) => {
  // Verify the label
  const label = screen.getByText(labelText);
  expect(label).toBeVisible();
  expect(label).toHaveAttribute('for', inputId);

  // Verify the input field
  const input = screen.getByLabelText(labelText);
  expect(input).toBeVisible();
  expect(input).toHaveAttribute('type', 'password');

  // Verify the help text
  if (helpText) {
    expect(screen.getByText(helpText)).toBeVisible();
  }

  // Verify the input field is required
  isRequired ? expect(input).toBeRequired() : expect(input).not.toBeRequired();
};

export const verifyListInput = ({
  labelText,
  inputId,
  inputValue,
  helpText,
  isRequired = false,
}: {
  labelText: string;
  inputId: string;
  inputValue?: string;
  helpText?: string;
  isRequired?: boolean;
}) => {
  const section = screen.getByTestId(inputId);

  // Verify the label
  const label = within(section).getByLabelText(labelText);
  expect(label).toBeVisible();

  // Verify the input field
  const input = within(section).getByRole('textbox', { name: labelText });
  expect(input).toHaveValue(inputValue);

  // Verify the help text
  if (helpText) {
    const helpTextElement = within(section).getAllByText(helpText)[0];
    expect(helpTextElement).toBeVisible();
  }

  // Verify if the input is required
  isRequired ? expect(input).toBeRequired() : expect(input).not.toBeRequired();
};

export const controlButtonTest = () => {
  const addButton = screen.getByRole('button', { name: 'Add' });
  const cancelButton = screen.getByRole('button', { name: 'Cancel' });

  expect(addButton).toBeVisible();
  expect(cancelButton).toBeVisible();
};
