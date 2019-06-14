import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Readiness, PodsDetailsPage } from '../../public/components/pod';
import { DetailsPage } from '../../public/components/factory';

describe('Readiness', () => {
  let pod;

  beforeEach(() => {
    pod = {
      status: {
        phase: 'Running',
        conditions: [],
      },
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

describe(PodsDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<PodsDetailsPage match={{url: '/k8s/ns/default/pods/example', path: '/k8s/ns/:ns/:plural/:name', isExact: true, params: {}}} kind="Pod" />);
  });

  it('renders `DetailsPage` with correct props', () => {
    expect(wrapper.find(DetailsPage).exists()).toBe(true);
  });
});
