import * as React from 'react';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { Formik, FormikConfig, FormikErrors } from 'formik';
import { renderWithProviders } from '../../../../test-utils/unit-test-utils';
import KeyValueFileInputField from '../KeyValueFileInputField';

const onSubmit = jest.fn();
const TestKeyValueInputField: React.FC<FormikConfig<any> & { disableRemoveAction?: boolean }> = ({
  initialValues,
  disableRemoveAction,
}) => (
  <Formik
    onSubmit={onSubmit}
    initialValues={initialValues}
    validate={(values) => {
      const errors: FormikErrors<{ keyValueInput: {} }> = {};
      values?.keyValueInput?.forEach((entry) => {
        if (entry.key === '') {
          errors.keyValueInput = [{ key: 'Required' }];
        }
      });
      return errors;
    }}
  >
    <KeyValueFileInputField
      name={'keyValueInput'}
      disableRemoveAction={disableRemoveAction}
      entries={initialValues.keyValueInput}
    />
  </Formik>
);

test('should have validation error given input field is touched and error exists on form', async () => {
  const { container } = renderWithProviders(
    <TestKeyValueInputField
      onSubmit={onSubmit}
      initialValues={{
        keyValueInput: [{ key: '', value: 'test' }],
      }}
    />,
  );

  const KeyField = container.querySelector('[data-test="key-0"]') as HTMLElement;
  act(() => {
    fireEvent.click(KeyField);
    fireEvent.blur(KeyField);
  });

  const validationErrors = await screen.findByText('Required');
  expect(validationErrors).toBeVisible();
});

test('should have remove key value pair button if there are more than one key value entries', async () => {
  const { container } = renderWithProviders(
    <TestKeyValueInputField
      onSubmit={onSubmit}
      initialValues={{
        keyValueInput: [
          { key: 'key-one', value: 'value-one' },
          { key: 'key-two', value: 'value-two' },
        ],
      }}
    />,
  );

  const removeButtons = container.querySelectorAll('[data-test="remove-key-value-button"]');
  expect(removeButtons).toHaveLength(2);
});

test('should not contain remove key value pair button if there is one entry', async () => {
  const { container } = renderWithProviders(
    <TestKeyValueInputField
      onSubmit={onSubmit}
      disableRemoveAction
      initialValues={{
        keyValueInput: [{ key: 'key-three', value: 'value-three' }],
      }}
    />,
  );

  await waitFor(() => {
    const removeButton = container.querySelector('[data-test="remove-key-value-button"]');
    expect(removeButton).toBeNull();
  });
});

test('should contain remove key value pair button if there is one entry and remove actions is set to false', async () => {
  const { container } = renderWithProviders(
    <TestKeyValueInputField
      onSubmit={onSubmit}
      disableRemoveAction={false}
      initialValues={{
        keyValueInput: [{ key: 'key-three', value: 'value-three' }],
      }}
    />,
  );

  await waitFor(() => {
    const removeButton = container.querySelector('[data-test="remove-key-value-button"]');
    expect(removeButton).not.toBeNull();
  });
});

test('should add new entry on clicking Add key/value button', async () => {
  const { container } = renderWithProviders(
    <TestKeyValueInputField
      onSubmit={onSubmit}
      initialValues={{
        keyValueInput: [{ key: 'key-three', value: 'value-three' }],
      }}
    />,
  );
  const addKeyValueButton = container.querySelector(
    '[data-test="add-key-value-button"]',
  ) as HTMLElement;
  fireEvent.click(addKeyValueButton);

  await waitFor(() => {
    const keyValuePair = container.querySelectorAll('[data-test="key-value-pair"]');
    expect(keyValuePair).toHaveLength(2);
  });
});
