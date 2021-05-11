import * as React from 'react';
import { shallow } from 'enzyme';
import { cloneDeep } from 'lodash';
import { MultiStreamLogs } from '../MultiStreamLogs';
import Logs from '../Logs';
import { podData } from './logs-test-data';

describe('MultiStreamLogs', () => {
  let props: React.ComponentProps<typeof MultiStreamLogs>;

  beforeEach(() => {
    props = {
      taskName: 'step-oc',
      resource: cloneDeep(podData),
    };
  });

  it('should not render logs when containers is not present', () => {
    props.resource.spec.containers = [];
    const wrapper = shallow(<MultiStreamLogs {...props} />);
    expect(wrapper.find(Logs)).toHaveLength(0);
  });

  it('should render inline loading based on logs completion', () => {
    const wrapper = shallow(<MultiStreamLogs {...props} />);
    expect(wrapper.find('.odc-multi-stream-logs__taskName--loading').exists()).toBe(false);
    expect(wrapper.find('.odc-multi-stream-logs__taskName').text()).toBe('step-oc');
  });

  it('should render number of logs equal to number of containers', () => {
    const containersLength = props.resource.spec.containers.length;
    const wrapper = shallow(<MultiStreamLogs {...props} />);
    expect(wrapper.find(Logs)).toHaveLength(containersLength);
  });
});
