import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { ContainerRow, Readiness, PodsDetailsPage } from '../../public/components/pod';
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

describe('ContainerRow', () => {
  let startTime;
  let finishTime;
  let pod;
  let container;
  let wrapper: ShallowWrapper;
  beforeAll(() => {
    startTime = Date.now();
    finishTime = Date.now() + 1;
    pod = {
      status: {
        conditions: [],
        containerStatuses: [
          {
            'name': 'hello-openshift',
            'state': {
              'running': {
                'startedAt': {startTime},
                'finishedAt': {finishTime},
              },
            },
            'restartCount': 10,
          },
        ],
      },
    };
    container = {
      name: 'hello-openshift',
      image: 'aosqe/hello-openshift',
    };
    wrapper = shallow(<ContainerRow pod={pod} container={container} />);
  });

  it('renders the container link', () => {
    expect(wrapper.find('ContainerLink').find({name: 'hello-openshift'}).exists()).toBe(true);
  });

  it('renders the container image', () => {
    expect(wrapper.childAt(1).text()).toContain('aosqe/hello-openshift');
  });

  it('renders the container state', () => {
    expect(wrapper.childAt(2).find({status: 'Running'}).exists()).toBe(true);
  });

  it('renders the container restart times', () => {
    expect(wrapper.childAt(3).text()).toBe('10');
  });

  it('renders the container started time', () => {
    expect(wrapper.childAt(4).find({timestamp: {startTime}}).exists()).toBe(true);
  });

  it('renders the container finished time', () => {
    expect(wrapper.childAt(5).find({timestamp: {finishTime}}).exists()).toBe(true);
  });

  it('renders the container exit code', () => {
    expect(wrapper.childAt(6).text()).toBe('-');
  });
});
