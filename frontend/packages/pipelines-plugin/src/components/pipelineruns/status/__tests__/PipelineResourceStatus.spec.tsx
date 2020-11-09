import * as React from 'react';
import { shallow } from 'enzyme';
import { Status } from '@console/shared';
import PipelineResourceStatus from '../PipelineResourceStatus';

type PipelineResourceStatusWrapperProps = React.ComponentProps<typeof PipelineResourceStatus>;

let componentProps: PipelineResourceStatusWrapperProps;

describe('PipelineResourceStatus', () => {
  beforeEach(() => {
    componentProps = {
      status: 'Failed',
      children: <div>Test Children</div>,
    };
  });

  it('should render Status without children', () => {
    const wrapper = shallow(<PipelineResourceStatus status={componentProps.status} />);
    expect(wrapper.find(Status).exists()).toBeTruthy();
    expect(wrapper.props().children).toBeFalsy();
  });

  it('should render status component even if the null value is passed', () => {
    const wrapper = shallow(<PipelineResourceStatus status={null} />);
    expect(wrapper.find(Status).exists()).toBeTruthy();
  });

  it('should not render the children when the status is not Failed', () => {
    const wrapper = shallow(<PipelineResourceStatus {...componentProps} status="Success" />);
    expect(wrapper.props().children).toBeFalsy();
  });

  it('should render the children when the status is Failed', () => {
    const wrapper = shallow(<PipelineResourceStatus {...componentProps} />);
    expect(wrapper.find(Status).exists).toBeDefined();
    expect(wrapper.props().children).toBe(componentProps.children);
  });
});
