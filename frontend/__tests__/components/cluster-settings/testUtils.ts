import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

export const verifyPageTitleAndSubtitle = ({
  title,
  subtitle,
}: {
  title?: string;
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

export const verifyFormField = ({
  labelText,
  inputRole = 'textbox',
  inputName,
  inputValue,
  inputId,
  helpText,
}: {
  labelText: string;
  inputRole?: string;
  inputName?: string;
  inputValue?: string;
  inputId?: string;
  helpText?: string;
}) => {
  // Verify the label
  const label = screen.getByText(labelText, { exact: true });
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
};

export const controlButtonTest = () => {
  const addButton = screen.getByRole('button', { name: 'Add' });
  const cancelButton = screen.getByRole('button', { name: 'Cancel' });

  expect(addButton).toBeVisible();
  expect(cancelButton).toBeVisible();
};

export const verifyInputPasswordField = ({
  labelText,
  inputForId,
  helpText,
}: {
  labelText: string;
  inputForId: string;
  helpText?: string;
}) => {
  // Verify the label
  const label = screen.getByText(labelText);
  expect(label).toBeVisible();
  expect(label).toHaveAttribute('for', inputForId);

  // Verify the input field
  const input = screen.getByLabelText(labelText);
  expect(input).toBeVisible();
  expect(input).toHaveAttribute('type', 'password');

  // Verify the help text
  if (helpText) {
    expect(screen.getByText(helpText)).toBeVisible();
  }
};
