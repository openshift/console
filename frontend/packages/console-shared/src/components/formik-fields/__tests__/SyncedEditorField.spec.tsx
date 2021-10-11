import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { useField } from 'formik';
import * as _ from 'lodash';
import { LoadingBox } from '@console/internal/components/utils';
import { EditorType } from '../../synced-editor/editor-toggle';
import { useEditorType } from '../../synced-editor/useEditorType';
import DynamicFormField from '../DynamicFormField';
import RadioGroupField from '../RadioGroupField';
import SyncedEditorField from '../SyncedEditorField';
import YAMLEditorField from '../YAMLEditorField';

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

const mockUseEditorType = useEditorType as jest.Mock;
const mockUseField = useField as jest.Mock;

describe('SyncedEditorField', () => {
  type SyncedEditorFieldProps = React.ComponentProps<typeof SyncedEditorField>;
  let wrapper: ShallowWrapper<SyncedEditorFieldProps>;

  const mockEditors = {
    form: <DynamicFormField name="formData" schema={{}} />,
    yaml: <YAMLEditorField name="yamlData" showSamples />,
  };

  const props: SyncedEditorFieldProps = {
    name: 'editorType',
    formContext: {
      name: 'formData',
      editor: mockEditors.form,
      isDisabled: false,
    },
    yamlContext: {
      name: 'yamlData',
      editor: mockEditors.yaml,
      isDisabled: false,
    },
    lastViewUserSettingKey: 'key',
  };

  afterEach(() => {
    mockUseField.mockReset();
    mockUseEditorType.mockReset();
  });

  it('should render radio group field inline', () => {
    mockUseField.mockReturnValue([{ value: EditorType.Form }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), true]);
    wrapper = shallow(<SyncedEditorField {...props} />);
    expect(wrapper.find(RadioGroupField).exists()).toBe(true);
    expect(
      wrapper
        .find(RadioGroupField)
        .first()
        .props().isInline,
    ).toBe(true);
  });

  it('should render dynamic form field if useEditorType returns form', () => {
    mockUseField.mockReturnValue([{ value: EditorType.Form }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), true]);
    wrapper = shallow(<SyncedEditorField {...props} />);
    expect(wrapper.find(DynamicFormField).exists()).toBe(true);
  });

  it('should render dynamic yaml field if useEditorType returns yaml', () => {
    mockUseField.mockReturnValue([{ value: EditorType.YAML }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.YAML, jest.fn(), true]);
    wrapper = shallow(<SyncedEditorField {...props} />);
    expect(wrapper.find(YAMLEditorField).exists()).toBe(true);
  });

  it('should disable corresponding radio button if any editor context is disabled', () => {
    mockUseField.mockReturnValue([{ value: EditorType.Form }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.Form, jest.fn(), true]);
    const newProps = _.cloneDeep(props);
    newProps.yamlContext.isDisabled = true;
    wrapper = shallow(<SyncedEditorField {...newProps} />);
    expect(
      wrapper
        .find(RadioGroupField)
        .first()
        .props().options[1].isDisabled,
    ).toBe(true);
  });

  it('should show an alert if form context is disaled', () => {
    mockUseField.mockReturnValue([{ value: EditorType.YAML }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.YAML, jest.fn(), true]);
    const newProps = _.cloneDeep(props);
    newProps.formContext.isDisabled = true;
    wrapper = shallow(<SyncedEditorField {...newProps} />);
    expect(wrapper.find(Alert).exists()).toBe(true);
    expect(
      wrapper
        .find(Alert)
        .first()
        .props().title,
    ).toBe('Form view is disabled for this chart because the schema is not available');
  });

  it('should render LoadingBox if useEditorType returns false for loaded', () => {
    mockUseField.mockReturnValue([{ value: EditorType.YAML }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.YAML, jest.fn(), false]);
    wrapper = shallow(<SyncedEditorField {...props} />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should render LoadingBox if formik field value does not match with editorType returned by useEditorType', () => {
    mockUseField.mockReturnValue([{ value: EditorType.Form }, {}]);
    mockUseEditorType.mockReturnValue([EditorType.YAML, jest.fn(), true]);
    wrapper = shallow(<SyncedEditorField {...props} />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });
});
