import type { FC } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikErrors } from 'formik';
import { Formik } from 'formik';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import KeyValueFileInputField from '../KeyValueFileInputField';

jest.mock('@patternfly/react-topology', () => ({}));

type TestKeyValueFormValues = {
  keyValueInput: { key: string; value: string }[];
};

const onSubmit = jest.fn();

const TestKeyValueInputField: FC<{
  initialValues: TestKeyValueFormValues;
  disableRemoveAction?: boolean;
}> = ({ initialValues, disableRemoveAction }) => (
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
      name="keyValueInput"
      disableRemoveAction={disableRemoveAction}
      entries={initialValues.keyValueInput}
    />
  </Formik>
);

describe('KeyValueFileInputField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation error when key is empty and field is touched', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TestKeyValueInputField
        initialValues={{
          keyValueInput: [{ key: '', value: 'test' }],
        }}
      />,
    );

    const keyField = screen.getByRole('textbox', { name: 'Key' });
    await user.click(keyField);
    await user.tab();

    expect(await screen.findByText('Required')).toBeVisible();
  });

  it('shows a remove control for each row when there is more than one entry', async () => {
    renderWithProviders(
      <TestKeyValueInputField
        initialValues={{
          keyValueInput: [
            { key: 'key-one', value: 'value-one' },
            { key: 'key-two', value: 'value-two' },
          ],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Remove key/value' })).toHaveLength(2);
    });
  });

  it('does not show remove controls when disableRemoveAction is true', async () => {
    renderWithProviders(
      <TestKeyValueInputField
        disableRemoveAction
        initialValues={{
          keyValueInput: [{ key: 'key-three', value: 'value-three' }],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Remove key/value' })).not.toBeInTheDocument();
    });
  });

  it('shows remove control for a single entry when disableRemoveAction is false', async () => {
    renderWithProviders(
      <TestKeyValueInputField
        disableRemoveAction={false}
        initialValues={{
          keyValueInput: [{ key: 'key-three', value: 'value-three' }],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove key/value' })).toBeVisible();
    });
  });

  it('adds a new row when Add key/value is activated', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TestKeyValueInputField
        initialValues={{
          keyValueInput: [{ key: 'key-three', value: 'value-three' }],
        }}
      />,
    );

    expect(screen.getAllByRole('textbox', { name: 'Key' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Add key/value' }));

    await waitFor(() => {
      expect(screen.getAllByRole('textbox', { name: 'Key' })).toHaveLength(2);
    });
  });
});
