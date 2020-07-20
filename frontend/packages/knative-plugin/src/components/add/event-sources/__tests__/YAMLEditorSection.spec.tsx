import * as React from 'react';
import { shallow } from 'enzyme';
import { YAMLEditorField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import YAMLEditorSection from '../YAMLEditorSection';

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    values: { type: 'CamelSource', yamlData: '' },
  })),
}));

describe('YAMLEditorSection', () => {
  const title = 'Jira';
  const wrapper = shallow(<YAMLEditorSection title={title} />);
  it('should render FormSection with proper props', () => {
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toEqual('Jira');
    expect(wrapper.find(FormSection).props().fullWidth).toBe(true);
    expect(wrapper.find(FormSection).props().flexLayout).toBe(true);
  });
  it('should render YAMLEditorField with proper props', () => {
    expect(wrapper.find(YAMLEditorField)).toHaveLength(1);
    expect(wrapper.find(YAMLEditorField).props().name).toEqual('yamlData');
  });
});
