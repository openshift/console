import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { ResourceDropdownField } from '@console/shared';
import SinkSourceModal from '../SinkSourceModal';
import { ServiceModel } from '../../../models';

type SinkSourceModalProps = React.ComponentProps<typeof SinkSourceModal>;

describe('SinkSourceModal Form', () => {
  let formProps: SinkSourceModalProps;
  let sinkSourceModalWrapper: ShallowWrapper<SinkSourceModalProps>;
  const formValues = {
    sink: {
      ref: {
        apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
        kind: ServiceModel.kind,
        name: 'event-greeter',
      },
    },
  };
  beforeEach(() => {
    formProps = {
      values: formValues,
      namespace: 'myapp',
      resourceName: 'myappes',
      errors: {},
      touched: {},
      isSubmitting: true,
      isValidating: true,
      status: {},
      submitCount: 0,
      dirty: false,
      handleReset: jest.fn(),
      handleSubmit: jest.fn(),
      getFieldProps: jest.fn(),
      handleBlur: jest.fn(),
      handleChange: jest.fn(),
      initialErrors: {},
      initialStatus: {},
      initialTouched: {},
      isValid: true,
      registerField: jest.fn(),
      resetForm: jest.fn(),
      setErrors: jest.fn(),
      setFieldError: jest.fn(),
      setFieldTouched: jest.fn(),
      setFieldValue: jest.fn(),
      setFormikState: jest.fn(),
      setStatus: jest.fn(),
      setSubmitting: jest.fn(),
      setTouched: jest.fn(),
      setValues: jest.fn(),
      submitForm: jest.fn(),
      unregisterField: jest.fn(),
      validateField: jest.fn(),
      validateForm: jest.fn(),
      getFieldMeta: jest.fn(),
      validateOnBlur: true,
      validateOnChange: true,
      initialValues: formValues,
    };
    sinkSourceModalWrapper = shallow(<SinkSourceModal {...formProps} />);
  });

  it('should render ModalTitle, body and footer', () => {
    expect(sinkSourceModalWrapper.find(ModalTitle)).toHaveLength(1);
    expect(sinkSourceModalWrapper.find(ModalBody)).toHaveLength(1);
    expect(sinkSourceModalWrapper.find(ModalSubmitFooter)).toHaveLength(1);
  });
  it('should render ResourceDropdownField for service', () => {
    const serviceDropDown = sinkSourceModalWrapper.find(ResourceDropdownField);
    expect(serviceDropDown).toHaveLength(1);
    expect(serviceDropDown.get(0).props.name).toBe('sink.ref.name');
    expect(serviceDropDown.get(0).props.selectedKey).toBe('event-greeter');
  });

  it('should call validateForm, setFieldValue onChange', () => {
    const modal = sinkSourceModalWrapper.find(ResourceDropdownField);
    modal.props().onChange('event-greeter');
    expect(formProps.setFieldTouched).toHaveBeenCalled();
    expect(formProps.setFieldValue).toHaveBeenCalled();
    expect(formProps.validateForm).toHaveBeenCalled();
  });

  it('should call handleSubmit on form submit', () => {
    sinkSourceModalWrapper.simulate('submit');
    expect(formProps.handleSubmit).toHaveBeenCalled();
  });
});
