import * as React from 'react';
import { screen, render, fireEvent, configure, act, waitFor } from '@testing-library/react';
import { Formik, FormikConfig, FormikErrors } from 'formik';
import KeyValueFileInputField from '../KeyValueFileInputField';

configure({ testIdAttribute: 'data-test' });

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
      values?.keyValueInput?.map((entry) => {
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
  render(
    <TestKeyValueInputField
      onSubmit={onSubmit}
      initialValues={{
        keyValueInput: [{ key: '', value: 'test' }],
      }}
    />,
  );

  const KeyField = screen.getByTestId('key-0');
  act(() => {
    fireEvent.click(KeyField);
    fireEvent.blur(KeyField);
  });

  const validationErrors = await screen.findByText(`Required`);
  expect(validationErrors.innerHTML).toBe('Required');
});

test('should have remove key value pair button if there are more than one key value entries', async () => {
  render(
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

  expect(await screen.findAllByTestId('remove-key-value-button')).toHaveLength(2);
});

test('should not contain remove key value pair button if there is one entry', async () => {
  render(
    <TestKeyValueInputField
      onSubmit={onSubmit}
      disableRemoveAction
      initialValues={{
        keyValueInput: [{ key: 'key-three', value: 'value-three' }],
      }}
    />,
  );

  await waitFor(() => {
    const removeButton = screen.queryByTestId('remove-key-value-button');
    expect(removeButton).toBeNull();
  });
});

test('should contain remove key value pair button if there is one entry and remove actions is set to false', async () => {
  render(
    <TestKeyValueInputField
      onSubmit={onSubmit}
      disableRemoveAction={false}
      initialValues={{
        keyValueInput: [{ key: 'key-three', value: 'value-three' }],
      }}
    />,
  );

  await waitFor(() => {
    const removeButton = screen.queryByTestId('remove-key-value-button');
    expect(removeButton).not.toBeNull();
  });
});

test('should add new entry on clicking Add key/value button', async () => {
  render(
    <TestKeyValueInputField
      onSubmit={onSubmit}
      initialValues={{
        keyValueInput: [{ key: 'key-three', value: 'value-three' }],
      }}
    />,
  );
  const addKeyValueButton = screen.getByTestId('add-key-value-button');
  fireEvent.click(addKeyValueButton);

  await waitFor(() => {
    const keyValuePair = screen.queryAllByTestId('key-value-pair');
    expect(keyValuePair).toHaveLength(2);
  });
});
