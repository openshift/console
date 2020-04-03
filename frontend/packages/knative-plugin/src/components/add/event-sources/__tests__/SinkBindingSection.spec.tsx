import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { InputField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import SinkBindingSection from '../SinkBindingSection';
import NameValueEditorComponent from '../NameValueEditorComponent';

type SinkBindingSectionProps = React.ComponentProps<typeof SinkBindingSection>;

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
    values: {
      type: 'SinkBinding',
    },
  })),
  getFieldId: jest.fn(),
}));
describe('SinkBindingSection', () => {
  let wrapper: ShallowWrapper<SinkBindingSectionProps>;
  beforeEach(() => {
    wrapper = shallow(<SinkBindingSection />);
  });
  it('should render FormSection', () => {
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toBe('SinkBinding');
  });

  it('should render NameValueEditor', () => {
    const nameValueEditorField = wrapper.find(NameValueEditorComponent);
    expect(nameValueEditorField).toHaveLength(1);
    expect(nameValueEditorField.props().nameString).toBe('Name');
    expect(nameValueEditorField.props().valueString).toBe('Value');
  });

  it('should render InputFields', () => {
    const inputFieldFieldItems = wrapper.find(InputField);
    expect(inputFieldFieldItems).toHaveLength(2);
  });
});
