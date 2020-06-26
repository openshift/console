import * as React from 'react';
import * as _ from 'lodash';
import { shallow } from 'enzyme';
import { useField } from 'formik';
import { Alert } from '@patternfly/react-core';
import SyncedEditorField from '../SyncedEditorField';
import RadioGroupField from '../RadioGroupField';
import DynamicFormField from '../DynamicFormField';
import YAMLEditorField from '../YAMLEditorField';

jest.mock('formik', () => ({
  useField: jest.fn(() => [{ value: 'form' }, {}]),
  useFormikContext: jest.fn(() => ({
    values: {},
    setFieldValue: jest.fn(),
  })),
}));

const mockEditors = {
  form: <DynamicFormField name="formData" schema={{}} />,
  yaml: <YAMLEditorField name="yamlData" />,
};

const props = {
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
};
describe('DropdownField', () => {
  it('should render radio group field inline', () => {
    const wrapper = shallow(<SyncedEditorField {...props} />);
    expect(wrapper.find(RadioGroupField).exists()).toBe(true);
    expect(
      wrapper
        .find(RadioGroupField)
        .first()
        .props().inline,
    ).toBe(true);
  });

  it('should render dynamic form field if initial editor type is form', () => {
    const wrapper = shallow(<SyncedEditorField {...props} />);
    expect(wrapper.find(DynamicFormField).exists()).toBe(true);
  });

  it('should render dynamic form field if initial editor type is form', () => {
    (useField as any).mockImplementation(() => [{ value: 'yaml' }, {}]);
    const wrapper = shallow(<SyncedEditorField {...props} />);
    expect(wrapper.find(YAMLEditorField).exists()).toBe(true);
  });

  it('should disable corresponding radio button if any editor context is disaled', () => {
    const newProps = _.cloneDeep(props);
    newProps.yamlContext.isDisabled = true;
    const wrapper = shallow(<SyncedEditorField {...newProps} />);
    expect(
      wrapper
        .find(RadioGroupField)
        .first()
        .props().options[1].isDisabled,
    ).toBe(true);
  });

  it('should show an alert if form context is disaled', () => {
    const newProps = _.cloneDeep(props);
    newProps.formContext.isDisabled = true;
    const wrapper = shallow(<SyncedEditorField {...newProps} />);
    expect(wrapper.find(Alert).exists()).toBe(true);
    expect(
      wrapper
        .find(Alert)
        .first()
        .props().title,
    ).toBe('Form view is disabled for this chart because the schema is not available');
  });
});
