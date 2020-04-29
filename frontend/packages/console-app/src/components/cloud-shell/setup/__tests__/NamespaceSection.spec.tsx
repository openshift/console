import * as React from 'react';
import { useFormikContext, useField } from 'formik';
import { shallow } from 'enzyme';
import { InputField, ResourceDropdownField, FLAGS } from '@console/shared';
import { InternalNamespaceSection } from '../NamespaceSection';
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

const canCreateFlags = { [FLAGS.CAN_CREATE_PROJECT]: true };
const noFlags = {};

describe('NamespaceSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should display InputField whent creating namespace', () => {
    (useField as jest.Mock).mockImplementationOnce(() => [{ value: CREATE_NAMESPACE_KEY }]);
    const wrapper = shallow(<InternalNamespaceSection flags={canCreateFlags} />);
    expect(wrapper.find(InputField).exists()).toBe(true);
  });

  it('should switch to create namespace mode if there are no projects', () => {
    const wrapper = shallow(<InternalNamespaceSection flags={canCreateFlags} />);
    wrapper
      .find(ResourceDropdownField)
      .props()
      .onLoad({});
    expect(useFormikContext().setFieldValue).toHaveBeenCalledWith(
      'namespace',
      CREATE_NAMESPACE_KEY,
    );
  });
  it('should switch from active namespace to no namespace no projects and user cannot create a project', () => {
    (useField as jest.Mock).mockReturnValueOnce([{ value: 'test-namespace' }]);

    const wrapper = shallow(<InternalNamespaceSection flags={noFlags} />);
    wrapper
      .find(ResourceDropdownField)
      .props()
      .onLoad({});
    expect(useFormikContext().setFieldValue).toHaveBeenCalledWith('namespace', undefined);
  });

  it('should update namespace value', () => {
    const wrapper = shallow(<InternalNamespaceSection flags={canCreateFlags} />);
    wrapper
      .find(ResourceDropdownField)
      .props()
      .onChange('test');
    expect(useFormikContext().setFieldValue).toHaveBeenCalledWith('namespace', 'test');
  });

  it('should include create project action when user can create a project', () => {
    const wrapper = shallow(<InternalNamespaceSection flags={canCreateFlags} />);
    expect(wrapper.find(ResourceDropdownField).props().actionItems?.[0]?.actionKey).toBe(
      CREATE_NAMESPACE_KEY,
    );
  });

  it('should omit create project action when user can create a project', () => {
    const wrapper = shallow(<InternalNamespaceSection flags={noFlags} />);
    expect(wrapper.find(ResourceDropdownField).props().actionItems).toBeUndefined();
  });
});
