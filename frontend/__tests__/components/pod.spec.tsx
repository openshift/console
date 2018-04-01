/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Readiness, PodsDetailsPage } from '../../public/components/pod';
import { DetailsPage } from '../../public/components/factory';
import { K8sResourceKind } from '../../public/module/k8s';
import { ReplicaSetModel } from '../../public/models';

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

describe(PodsDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper;
  let pod: K8sResourceKind;

  beforeEach(() => {
    pod = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: 'example',
        namespace: 'default',
        ownerReferences: [{apiVersion: ReplicaSetModel.apiVersion, kind: ReplicaSetModel.kind, name: 'example-rs', uid: '9999'}],
      },
    };
    wrapper = shallow(<PodsDetailsPage match={{url: '/k8s/ns/default/pods/example', path: '/k8s/ns/:ns/:plural/:name', isExact: true, params: {}}} />);
  });

  it('renders `DetailsPage` with correct props', () => {
    expect(wrapper.find(DetailsPage).exists()).toBe(true);
  });

  it('passes function to create breadcrumbs for Pod', () => {
    expect(wrapper.find(DetailsPage).props().breadcrumbsFor(pod)).toEqual([
      {name: pod.metadata.ownerReferences[0].name, path: `/k8s/ns/default/${ReplicaSetModel.plural}/example-rs`},
      {name: 'Pod Details', path: '/k8s/ns/default/pods/example'},
    ]);
  });
});
