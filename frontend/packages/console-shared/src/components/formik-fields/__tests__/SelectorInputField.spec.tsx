import { screen } from '@testing-library/react';
import { useFormikContext, useField } from 'formik';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import SelectorInputField from '../SelectorInputField';

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({})),
  useField: jest.fn(() => [{}, {}]),
}));

const useFormikContextMock = useFormikContext as jest.Mock;
const useFieldMock = useField as jest.Mock;

describe('SelectorInputField', () => {
  beforeEach(() => {
    useFormikContextMock.mockClear();
    useFieldMock.mockClear();
  });

  it('should render and use formik hooks', () => {
    renderWithProviders(
      <SelectorInputField
        name="field-name"
        label="a label"
        placeholder="a placeholder"
        dataTest="field-test-id"
      />,
    );

    expect(useFormikContextMock).toHaveBeenCalled();
    expect(useFieldMock).toHaveBeenCalled();
    expect(screen.getByText('a label')).toBeVisible();
  });
});
