import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { InputField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { AsyncComponent } from '@console/internal/components/utils/async';
import SinkBindingSection from '../SinkBindingSection';

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
  const title = 'Sink Binding';
  let wrapper: ShallowWrapper<SinkBindingSectionProps>;
  beforeEach(() => {
    wrapper = shallow(<SinkBindingSection title={title} />);
  });
  it('should render FormSection', () => {
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toBe('Sink Binding');
  });

  it('should render NameValueEditor', () => {
    const nameValueEditorField = wrapper.find(AsyncComponent);
    expect(nameValueEditorField).toHaveLength(1);
    expect(nameValueEditorField.props().nameString).toBe('Name');
    expect(nameValueEditorField.props().valueString).toBe('Value');
  });

  it('should render InputFields', () => {
    const inputFieldFieldItems = wrapper.find(InputField);
    expect(inputFieldFieldItems).toHaveLength(2);
  });
});
