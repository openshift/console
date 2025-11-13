import { screen } from '@testing-library/react';
import { useField } from 'formik';
import { LoadingBox } from '@console/internal/components/utils';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { EditorType } from '../../synced-editor/editor-toggle';
import { useEditorType } from '../../synced-editor/useEditorType';
import RadioGroupField from '../RadioGroupField';
import SyncedEditorField from '../SyncedEditorField';

jest.mock('formik', () => ({
  useField: jest.fn(() => [{ value: 'form' }, {}]),
  useFormikContext: jest.fn(() => ({
    values: {},
    setFieldValue: jest.fn(),
  })),
}));

jest.mock('../../synced-editor/useEditorType', () => ({
  useEditorType: jest.fn(),
}));

jest.mock('../CodeEditorField', () => () => 'Form Editor');

jest.mock('../DynamicFormField', () => () => 'YAML Editor');

jest.mock('../RadioGroupField', () => ({
  default: jest.fn(() => null),
}));

jest.mock('@console/internal/components/utils/status-box', () => ({
  LoadingBox: jest.fn(() => null),
}));

const mockUseEditorType = useEditorType as jest.Mock;
const mockUseField = useField as jest.Mock;
const mockRadioGroupField = RadioGroupField as jest.Mock;
const mockLoadingBox = LoadingBox as jest.Mock;

describe('SyncedEditorField', () => {
  type SyncedEditorFieldProps = React.ComponentProps<typeof SyncedEditorField>;

  const props: SyncedEditorFieldProps = {
    name: 'editorType',
    formContext: {
      name: 'formData',
      editor: 'Form Editor',
      isDisabled: false,
    },
    yamlContext: {
      name: 'yamlData',
      editor: 'YAML Editor',
      isDisabled: false,
    },
    lastViewUserSettingKey: 'test.lastView',
  };

  beforeEach(() => {
    mockRadioGroupField.mockClear();
    mockLoadingBox.mockClear();
  });

  it('should render loading box if editor type not loaded', () => {
    mockUseField.mockReturnValue([{ value: EditorType.Form }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), false]);

    renderWithProviders(<SyncedEditorField {...props} />);

    expect(mockLoadingBox).toHaveBeenCalled();
  });

  it('should render radio group field when loaded', () => {
    mockUseField.mockReturnValue([{ value: EditorType.Form }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), true]);

    renderWithProviders(<SyncedEditorField {...props} />);

    expect(mockRadioGroupField).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'editorType',
      }),
      {},
    );
  });

  it('should render form editor if useEditorType returns form', () => {
    mockUseField.mockReturnValue([{ value: EditorType.Form }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), true]);

    renderWithProviders(<SyncedEditorField {...props} />);

    expect(screen.getByText('Form Editor')).toBeVisible();
  });

  it('should render yaml editor if useEditorType returns yaml', () => {
    mockUseField.mockReturnValue([{ value: EditorType.YAML }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.YAML, jest.fn(), true]);

    renderWithProviders(<SyncedEditorField {...props} />);

    expect(screen.getByText('YAML Editor')).toBeVisible();
  });

  it('should allow disabling form context', () => {
    mockUseField.mockReturnValue([{ value: EditorType.YAML }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.YAML, jest.fn(), true]);

    const disabledProps = {
      ...props,
      formContext: {
        ...props.formContext,
        isDisabled: true,
      },
    };

    renderWithProviders(<SyncedEditorField {...disabledProps} />);

    const callArgs = mockRadioGroupField.mock.calls[0][0];
    expect(callArgs.options).toEqual([
      expect.objectContaining({ value: EditorType.Form, isDisabled: true }),
      expect.objectContaining({ value: EditorType.YAML, isDisabled: false }),
    ]);
  });

  it('should allow disabling yaml context', () => {
    mockUseField.mockReturnValue([{ value: EditorType.Form }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), true]);

    const disabledProps = {
      ...props,
      yamlContext: {
        ...props.yamlContext,
        isDisabled: true,
      },
    };

    renderWithProviders(<SyncedEditorField {...disabledProps} />);

    const callArgs = mockRadioGroupField.mock.calls[0][0];
    expect(callArgs.options).toEqual([
      expect.objectContaining({ value: EditorType.Form, isDisabled: false }),
      expect.objectContaining({ value: EditorType.YAML, isDisabled: true }),
    ]);
  });
});
