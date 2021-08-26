import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { InputField } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import SinkUriModal from '../SinkUriModal';

type SinkUriModalProps = React.ComponentProps<typeof SinkUriModal>;

describe('SinkUriModal Form', () => {
  let formProps: SinkUriModalProps;
  let SinkUriModalWrapper: ShallowWrapper<SinkUriModalProps>;
  const formValues = {
    uri: 'http://svc.cluster.com',
  };
  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      values: formValues,
      initialValues: formValues,
    };
    SinkUriModalWrapper = shallow(<SinkUriModal {...formProps} />);
  });

  it('should render ModalTitle, body and footer', () => {
    expect(SinkUriModalWrapper.find(ModalTitle)).toHaveLength(1);
    expect(SinkUriModalWrapper.find(ModalBody)).toHaveLength(1);
    expect(SinkUriModalWrapper.find(ModalSubmitFooter)).toHaveLength(1);
  });

  it('should render InputField for uri', () => {
    const inputField = SinkUriModalWrapper.find(InputField);
    expect(inputField).toHaveLength(1);
    expect(inputField.get(0).props.name).toBe('uri');
  });

  it('should call handleSubmit on form submit', () => {
    SinkUriModalWrapper.simulate('submit');
    expect(formProps.handleSubmit).toHaveBeenCalled();
  });

  it('Save should be disabled if value is not changed', () => {
    const modalSubmitFooter = SinkUriModalWrapper.find(ModalSubmitFooter);
    expect(modalSubmitFooter.get(0).props.submitDisabled).toBe(true);
  });

  it('Save should be enabled if value is  changed', () => {
    const sinkValues = {
      uri: 'http://svc.cluster12.com',
    };
    formProps = {
      ...formProps,
      values: {
        ...formProps.values,
        ...sinkValues,
      },
    };
    SinkUriModalWrapper = shallow(<SinkUriModal {...formProps} />);
    const modalSubmitFooter = SinkUriModalWrapper.find(ModalSubmitFooter);
    expect(modalSubmitFooter.get(0).props.submitDisabled).toBe(false);
  });
});
