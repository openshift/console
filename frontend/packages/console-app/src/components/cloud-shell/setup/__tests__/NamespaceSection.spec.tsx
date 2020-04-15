import * as React from 'react';
import { useFormikContext, useField } from 'formik';
import { shallow } from 'enzyme';
import { InputField, ResourceDropdownField } from '@console/shared';
import NamespaceSection from '../NamespaceSection';
import { CREATE_NAMESPACE_KEY } from '../cloud-shell-setup-utils';

jest.mock('formik', () => {
  const context = {
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
  };
  return {
    useField: jest.fn(() => [{}, {}]),
    useFormikContext: jest.fn(() => context),
    getFieldId: jest.fn(),
  };
});

describe('NamespaceSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should display InputField whent creating namespace', () => {
    (useField as jest.Mock).mockImplementationOnce(() => [{ value: CREATE_NAMESPACE_KEY }]);
    const wrapper = shallow(<NamespaceSection />);
    expect(wrapper.find(InputField).exists()).toBe(true);
  });

  it('should switch to create namespace mode if there are no projects', () => {
    const wrapper = shallow(<NamespaceSection />);
    wrapper
      .find(ResourceDropdownField)
      .props()
      .onLoad({});
    expect(useFormikContext().setFieldValue).toHaveBeenCalledWith(
      'namespace',
      CREATE_NAMESPACE_KEY,
    );
  });

  it('should update namespace value', () => {
    const wrapper = shallow(<NamespaceSection />);
    wrapper
      .find(ResourceDropdownField)
      .props()
      .onChange('test');
    expect(useFormikContext().setFieldValue).toHaveBeenCalledWith('namespace', 'test');
  });
});
