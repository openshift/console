import * as React from 'react';
import { shallow } from 'enzyme';
import { ResourceDropdownField } from '@console/shared';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import ApiServerSection from '../ApiServerSection';

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
    values: {
      type: 'ApiServerSource',
    },
  })),
  getFieldId: jest.fn(),
}));
describe('ApiServerSection', () => {
  it('should render FormSection', () => {
    const wrapper = shallow(<ApiServerSection namespace="test-project" />);
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toBe('ApiServerSource');
  });

  it('should render NameValueEditor', () => {
    const wrapper = shallow(<ApiServerSection namespace="test-project" />);
    const nameValueEditorField = wrapper.find(NameValueEditor);
    expect(nameValueEditorField).toHaveLength(1);
    expect(nameValueEditorField.props().nameString).toBe('apiVersion');
    expect(nameValueEditorField.props().valueString).toBe('kind');
  });
  it('should render ResourceDropdownField', () => {
    const wrapper = shallow(<ApiServerSection namespace="test-project" />);
    expect(wrapper.find(ResourceDropdownField)).toHaveLength(1);
  });
});
