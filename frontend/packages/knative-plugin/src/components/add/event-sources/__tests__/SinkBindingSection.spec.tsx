import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { InputField } from '@console/shared';
import SinkBindingSection from '../SinkBindingSection';

type SinkBindingSectionProps = React.ComponentProps<typeof SinkBindingSection>;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

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

const i18nNS = 'knative-plugin';

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
    expect(nameValueEditorField.props().nameString).toBe(`${i18nNS}~Name`);
    expect(nameValueEditorField.props().valueString).toBe(`${i18nNS}~Value`);
  });

  it('should render InputFields', () => {
    const inputFieldFieldItems = wrapper.find(InputField);
    expect(inputFieldFieldItems).toHaveLength(2);
  });
});
