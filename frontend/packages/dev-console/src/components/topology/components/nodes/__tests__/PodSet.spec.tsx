import * as React from 'react';
import { shallow } from 'enzyme';
import { PodKind } from '@console/internal/module/k8s';
import { PodStatus } from '@console/shared';
import PodSet from '../PodSet';
import { DonutStatusData } from '../../../topology-types';
import { samplePods } from '../../../__tests__/topology-test-data';

describe(PodSet.displayName, () => {
  let data: DonutStatusData;
  beforeEach(() => {
    const rc = {
      pods: [],
      alerts: {},
      revision: 0,
      obj: {
        kind: 'ReplicationController',
        metadata: {},
        spec: {},
        status: {},
      },
      phase: 'Complete',
    };
    data = {
      dc: {
        kind: 'DeploymentConfig',
        metadata: {},
        spec: {},
        status: {},
      },
      current: { ...rc },
      previous: { ...rc },
      pods: [],
      isRollingOut: false,
    };
  });
  it('should component exists', () => {
    const wrapper = shallow(<PodSet data={data} size={10} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should PodStatus with key `notDeploy` exists', () => {
    data.pods = [samplePods.data[0] as PodKind];
    const wrapper = shallow(<PodSet data={data} size={10} />);
    expect(wrapper.find(PodStatus)).toHaveLength(1);
    expect(wrapper.find(PodStatus).get(0).key).toEqual('notDeploy');
    expect(wrapper.find(PodStatus).get(0).props.data).toEqual([samplePods.data[0] as PodKind]);
  });

  it('should PodStatus with key `deploy` exists', () => {
    const rc = {
      pods: [samplePods.data[0] as PodKind],
      alerts: {},
      revision: 0,
      obj: {
        kind: 'ReplicationController',
        metadata: {},
        spec: {},
        status: {},
      },
      phase: 'Pending',
    };
    data.current = { ...rc };
    data.dc = {
      kind: 'DeploymentConfig',
      metadata: {},
      status: {},
      spec: { strategy: { type: 'Rolling' } },
    };
    data.isRollingOut = true;
    const wrapper = shallow(<PodSet data={data} size={10} />);
    expect(wrapper.find(PodStatus)).toHaveLength(2);
    expect(wrapper.find(PodStatus).get(0).key).toEqual('deploy');
    expect(wrapper.find(PodStatus).get(0).props.data).toEqual([]);
    expect(wrapper.find(PodStatus).get(1).props.data).toEqual([samplePods.data[0] as PodKind]);
  });

  it('should PodStatus with key `notDeploy` exists when there is no strategy mentioned', () => {
    data.dc = {
      kind: 'DeploymentConfig',
      metadata: {},
      status: {},
      spec: { strategy: { type: 'Rolling' } },
    };
    const wrapper = shallow(<PodSet data={data} size={10} />);
    expect(wrapper.find(PodStatus)).toHaveLength(1);
    expect(wrapper.find(PodStatus).get(0).key).toEqual('notDeploy');
    expect(wrapper.find(PodStatus).get(0).props.data).toEqual([]);
  });
});
