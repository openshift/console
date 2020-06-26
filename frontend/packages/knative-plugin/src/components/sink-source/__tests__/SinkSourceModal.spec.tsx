import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { ResourceDropdownField } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import SinkSourceModal from '../SinkSourceModal';
import { ServiceModel } from '../../../models';

type SinkSourceModalProps = React.ComponentProps<typeof SinkSourceModal>;

describe('SinkSourceModal Form', () => {
  let formProps: SinkSourceModalProps;
  let sinkSourceModalWrapper: ShallowWrapper<SinkSourceModalProps>;
  const formValues = {
    ref: {
      apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
      kind: ServiceModel.kind,
      name: 'event-greeter',
    },
  };
  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      values: formValues,
      resourceName: 'myappes',
      initialValues: formValues,
      resourceDropdown: [],
      labelTitle: 'Move Sink',
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
    expect(serviceDropDown.get(0).props.name).toBe('ref.name');
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

  it('Save should be disabled if value is not changed', () => {
    const modalSubmitFooter = sinkSourceModalWrapper.find(ModalSubmitFooter);
    expect(modalSubmitFooter.get(0).props.submitDisabled).toBe(true);
  });

  it('Save should be enabled if value is  changed', () => {
    const sinkValues = {
      ref: {
        apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
        kind: ServiceModel.kind,
        name: 'event-greeter-new',
      },
    };
    formProps = {
      ...formProps,
      values: {
        ...formProps.values,
        ...sinkValues,
      },
      resourceDropdown: [],
      labelTitle: 'Move Sink',
    };
    sinkSourceModalWrapper = shallow(<SinkSourceModal {...formProps} />);
    const modalSubmitFooter = sinkSourceModalWrapper.find(ModalSubmitFooter);
    expect(modalSubmitFooter.get(0).props.submitDisabled).toBe(false);
  });
});
