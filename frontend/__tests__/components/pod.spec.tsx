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

describe('Renders ContainerRow', () => {
  let pod;
  let container;
  let wrapper: ShallowWrapper;
  beforeEach(() => {
    pod = {
      status: {
        conditions: [],
        containerStatuses: [],
      },
    };
    container = {
      name: 'hello-openshift',
      image: 'aosqe/hello-openshift',
    };
  });

  it('renders container Name in row', () => {
    wrapper = shallow(<ContainerRow pod={pod} container={container} />);
    expect(wrapper.find('ContainerLink').find({name: 'hello-openshift'}).exists()).toBe(true);
  });

  it('renders container Image in row', () => {
    wrapper = shallow(<ContainerRow pod={pod} container={container} />);
    expect(wrapper.find('div').find({className: 'col-lg-2 col-md-3 col-sm-5 col-xs-7 co-truncate co-nowrap co-select-to-copy'}).text()).toContain('aosqe/hello-openshift');
  });

  it('renders container State and Started in row', () => {
    const startTime = Date.now();
    pod.status.containerStatuses = [
      {
        'name': 'hello-openshift',
        'state': {
          'running': {
            'startedAt': {startTime},
          },
        },
      },
    ];
    wrapper = shallow(<ContainerRow pod={pod} container={container} />);
    expect(wrapper.find('div').find({className: 'col-lg-2 col-md-2 col-sm-3 hidden-xs'}).find({status: 'Running'}).exists()).toBe(true);
    expect(wrapper.find('Timestamp').find({timestamp: {startTime}}).exists()).toBe(true);
  });

  it('renders container Restarts in row', () => {
    pod.status.containerStatuses = [{'name': 'hello-openshift', 'restartCount': 10}];
    wrapper = shallow(<ContainerRow pod={pod} container={container} />);
    expect(wrapper.find('div').find({className: 'col-lg-1 col-md-2 hidden-sm hidden-xs'}).text()).toBe('10');
  });

  it('renders container Exit Code in row', () => {
    wrapper = shallow(<ContainerRow pod={pod} container={container} />);
    expect(wrapper.find('div').find({className: 'col-lg-1 hidden-md hidden-sm hidden-xs'}).text()).toBe('-');
  });
});
