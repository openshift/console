/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import { Map as ImmutableMap } from 'immutable';
import Spy = jasmine.Spy;

import { Firehose } from '../../../public/components/utils/firehose';
import { FirehoseResource } from '../../../public/components/utils';
import { K8sKind, K8sResourceKindReference } from '../../../public/module/k8s';
import { PodModel, ServiceModel } from '../../../public/models';

// TODO(alecmerdler): Use these once `Firehose` is converted to TypeScript
type FirehoseProps = {
  expand?: boolean;
  forceUpdate?: boolean;
  resources: FirehoseResource[];

  // Provided by `connect`
  k8sModels: ImmutableMap<K8sResourceKindReference, K8sKind>;
  loaded: boolean;
  inFlight: boolean;
  stopK8sWatch: (id: string) => void;
  watchK8sObject: (id: string, name: string, namespace: string, query: any, k8sKind: K8sKind) => void;
  watchK8sList: (id: string, query: any, k8sKind: K8sKind) => void;
};

describe(Firehose.displayName, () => {
  const Component: React.ComponentType<FirehoseProps> = Firehose.WrappedComponent as any;
  let wrapper: ShallowWrapper<FirehoseProps>;
  let resources: FirehoseResource[];
  let k8sModels: ImmutableMap<K8sResourceKindReference, K8sKind>;
  let stopK8sWatch: Spy;
  let watchK8sObject: Spy;
  let watchK8sList: Spy;

  beforeEach(() => {
    resources = [
      {kind: PodModel.kind, namespace: 'default', prop: 'Pod', isList: true},
    ];
    k8sModels = ImmutableMap<K8sResourceKindReference, K8sKind>().set('Pod', PodModel);
    stopK8sWatch = jasmine.createSpy('stopK8sWatch');
    watchK8sObject = jasmine.createSpy('watchK8sObject');
    watchK8sList = jasmine.createSpy('watchK8sList');

    wrapper = shallow(<Component resources={resources} k8sModels={k8sModels} loaded={true} inFlight={false} stopK8sWatch={stopK8sWatch} watchK8sObject={watchK8sObject} watchK8sList={watchK8sList} />);
  });

  it('returns nothing if there are no cached models and `props.inFlight` is true', () => {
    const noModels = ImmutableMap<K8sResourceKindReference, K8sKind>();
    wrapper = shallow(<Component resources={resources} k8sModels={noModels} loaded={false} inFlight={true} stopK8sWatch={stopK8sWatch} watchK8sObject={watchK8sObject} watchK8sList={watchK8sList} />);

    expect(wrapper.html()).toBeNull();
  });

  it('returns nothing if a required model from `props.resources` is missing and `props.inFlight` is true', () => {
    const incompleteModels = ImmutableMap<K8sResourceKindReference, K8sKind>().set('Service', ServiceModel);
    wrapper = shallow(<Component resources={resources} k8sModels={incompleteModels} loaded={false} inFlight={true} stopK8sWatch={stopK8sWatch} watchK8sObject={watchK8sObject} watchK8sList={watchK8sList} />);

    expect(wrapper.html()).toBeNull();
  });

  it('renders if a cached model is available even if `props.inFlight` is true', () => {
    wrapper = shallow(<Component resources={resources} k8sModels={k8sModels} loaded={false} inFlight={true} stopK8sWatch={stopK8sWatch} watchK8sObject={watchK8sObject} watchK8sList={watchK8sList} />);

    expect(watchK8sList.calls.count()).toBeGreaterThan(0);
  });

  it('does not re-render when `props.inFlight` changes but Firehose data is loaded', () => {
    expect(wrapper.instance().shouldComponentUpdate({inFlight: true, loaded: true} as FirehoseProps, null, null)).toBe(false);
  });

  it('clears and restarts "firehoses" when `props.resources` change', () => {
    resources = resources.concat([{kind: ServiceModel.kind, namespace: 'default', prop: 'Service', isList: true}]);
    wrapper = wrapper.setProps({resources});

    expect(stopK8sWatch.calls.count()).toEqual(1);
    expect(watchK8sList.calls.count()).toEqual(2);
  });
});
