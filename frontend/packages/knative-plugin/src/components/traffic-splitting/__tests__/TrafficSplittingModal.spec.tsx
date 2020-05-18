import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ModalSubmitFooter } from '@console/internal/components/factory/modal';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import TrafficSplittingModal from '../TrafficSplittingModal';
import {
  mockTrafficData,
  mockRevisionItems,
} from '../../../utils/__mocks__/traffic-splitting-utils-mock';

type TrafficSplittingModalProps = React.ComponentProps<typeof TrafficSplittingModal>;

describe('TrafficSplittingModal', () => {
  let wrapper: ShallowWrapper<TrafficSplittingModalProps>;
  let formProps: TrafficSplittingModalProps;
  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      status: { error: 'checkErrorProp' },
      values: { trafficSplitting: mockTrafficData },
      revisionItems: mockRevisionItems,
      cancel: jest.fn(),
    };
    wrapper = shallow(<TrafficSplittingModal {...formProps} />);
  });

  it('should render modal footer with proper values', () => {
    wrapper.find('form').simulate('submit', {
      preventDefault: () => {},
    });
    expect(
      wrapper
        .find(ModalSubmitFooter)
        .first()
        .props().inProgress,
    ).toBe(true);
    expect(
      wrapper
        .find(ModalSubmitFooter)
        .first()
        .props().errorMessage,
    ).toEqual('checkErrorProp');
  });

  it('should call handleSubmit on submit', () => {
    wrapper.find('form').simulate('submit', {
      preventDefault: () => {},
    });
    expect(formProps.handleSubmit).toHaveBeenCalled();
  });
});
