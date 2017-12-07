import * as React from 'react';
import { shallow } from 'enzyme';
import { Readiness } from '../../public/components/pod';

describe('Readiness', () => {
  let pod;

  beforeEach(() => {
    pod = {
      status: {
        phase: 'Running',
        conditions: [],
      }
    };
  });

  it('renders pod readiness with error styling if given pod is in invalid readiness state', () => {
    const invalidReadinessStates = new Set(['Unschedulable', 'PodScheduled']);
    invalidReadinessStates.forEach(state => {
      pod.status.conditions = [{type: state, status: 'False'}];
      const wrapper = shallow(<Readiness pod={pod} />);

      expect(wrapper.hasClass('co-error')).toBe(true);
    });
  });

  it('renders pod readiness without error styling if readiness is valid state', () => {
    const validReadinessStates = new Set(['Ready', 'PodCompleted']);
    validReadinessStates.forEach(state => {
      pod.status.conditions = [{type: state, status: 'False'}];
      const wrapper = shallow(<Readiness pod={pod} />);

      expect(wrapper.hasClass('co-error')).toBe(false);
    });
  });
});
