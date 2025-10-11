import { screen } from '@testing-library/react';
import { useFormikContext, useField } from 'formik';
import { SelectorInput } from '@console/internal/components/utils';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import SelectorInputField from '../SelectorInputField';

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({})),
  useField: jest.fn(() => [{}, {}]),
}));

// This mock has implementation complexity because SelectorInputField
// relies on SelectorInput.arrayify() and SelectorInput.objectify() to convert
// between object format (Record<string, string>) and tag array format (string[]).
jest.mock('@console/internal/components/utils', () => {
  const mockFn = jest.fn(() => null) as jest.Mock & {
    arrayify: (obj: Record<string, string | boolean | null>) => string[];
    objectify: (arr: string[]) => Record<string, string | null>;
  };

  mockFn.arrayify = (obj: Record<string, string | boolean | null>) => {
    if (typeof obj !== 'object' || obj === null) return [];
    return Object.entries(obj).map(([key, value]) => (value === null ? key : `${key}=${value}`));
  };

  mockFn.objectify = (arr: string[]) => {
    return arr.reduce((acc, item) => {
      const [key, value] = item.split('=');
      acc[key] = value || null;
      return acc;
    }, {} as Record<string, string | null>);
  };

  return {
    SelectorInput: mockFn,
  };
});

const mockSelectorInput = (SelectorInput as unknown) as jest.Mock;
const useFormikContextMock = useFormikContext as jest.Mock;
const useFieldMock = useField as jest.Mock;

describe('SelectorInputField', () => {
  beforeEach(() => {
    useFormikContextMock.mockClear();
    useFieldMock.mockClear();
    mockSelectorInput.mockClear();
  });

  it('should use formik data to render child components', () => {
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

    expect(screen.getByText('a label')).toBeInTheDocument();

    expect(mockSelectorInput).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: [],
        inputProps: {
          id: 'form-selector-field-name-field',
          'data-test': 'field-test-id',
        },
      }),
      {},
    );
  });

  it('should automatically convert objects to a tags-array', () => {
    useFieldMock.mockReturnValue([
      {
        value: {
          labelwithoutvalue: null,
          labelwithstring: 'a-string',
          labelwithboolean: true,
        },
      },
      {},
    ]);

    renderWithProviders(
      <SelectorInputField
        name="field-name"
        label="a label"
        placeholder="a placeholder"
        dataTest="field-test-id"
      />,
    );

    expect(screen.getByText('a label')).toBeInTheDocument();

    expect(mockSelectorInput).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['labelwithoutvalue', 'labelwithstring=a-string', 'labelwithboolean=true'],
        inputProps: {
          id: 'form-selector-field-name-field',
          'data-test': 'field-test-id',
        },
      }),
      {},
    );
  });

  it('should set formik objects when receiving tag-array change events', () => {
    const setFieldValueMock = jest.fn();
    const setFieldTouchedMock = jest.fn();
    useFormikContextMock.mockReturnValue({
      setFieldValue: setFieldValueMock,
      setFieldTouched: setFieldTouchedMock,
    });
    useFieldMock.mockReturnValue([
      {
        value: {
          labelwithoutvalue: null,
          labelwithstring: 'a-string',
          labelwithboolean: true,
        },
      },
      {},
    ]);

    renderWithProviders(
      <SelectorInputField
        name="field-name"
        label="a label"
        placeholder="a placeholder"
        dataTest="field-test-id"
      />,
    );

    const lastCall = mockSelectorInput.mock.calls[mockSelectorInput.mock.calls.length - 1];
    const onChangeHandler = lastCall[0].onChange;

    onChangeHandler([
      'another-labelwithoutvalue',
      'another-labelwithstring=a-string',
      'another-labelwithboolean=true',
    ]);

    expect(setFieldValueMock).toHaveBeenCalledTimes(1);
    expect(setFieldValueMock).toHaveBeenCalledWith(
      'field-name',
      {
        'another-labelwithoutvalue': null,
        'another-labelwithstring': 'a-string',
        'another-labelwithboolean': 'true',
      },
      false,
    );

    expect(setFieldTouchedMock).toHaveBeenCalledTimes(1);
    expect(setFieldTouchedMock).toHaveBeenCalledWith('field-name', true, true);
  });
});
