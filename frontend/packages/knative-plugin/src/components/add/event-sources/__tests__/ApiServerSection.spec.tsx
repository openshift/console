import * as React from 'react';
import { shallow } from 'enzyme';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { AsyncComponent } from '@console/internal/components/utils/async';
import ServiceAccountDropdown from '../../../dropdowns/ServiceAccountDropdown';
import ApiServerSection from '../ApiServerSection';

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
      type: 'ApiServerSource',
    },
  })),
  getFieldId: jest.fn(),
}));

describe('ApiServerSection', () => {
  const title = 'Api Server Source';
  it('should render FormSection', () => {
    const wrapper = shallow(<ApiServerSection title={title} />);
    expect(wrapper.find(FormSection)).toHaveLength(1);
    expect(wrapper.find(FormSection).props().title).toBe('Api Server Source');
  });

  it('should render NameValueEditor', () => {
    const wrapper = shallow(<ApiServerSection title={title} />);
    const nameValueEditorField = wrapper.find(AsyncComponent);
    expect(nameValueEditorField).toHaveLength(1);
    expect(nameValueEditorField.props().nameString).toBe('apiVersion');
    expect(nameValueEditorField.props().valueString).toBe('kind');
  });
  it('should render ServiceAccountDropdown', () => {
    const wrapper = shallow(<ApiServerSection title={title} />);
    expect(wrapper.find(ServiceAccountDropdown)).toHaveLength(1);
  });
});
