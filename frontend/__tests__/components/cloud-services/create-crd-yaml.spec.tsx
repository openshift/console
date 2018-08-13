/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash-es';
import { safeDump } from 'js-yaml';

import { CreateCRDYAML, CreateCRDYAMLProps } from '../../../public/components/cloud-services/create-crd-yaml';
import { Firehose, LoadingBox } from '../../../public/components/utils';
import { ClusterServiceVersionModel } from '../../../public/models';
import { referenceForModel, referenceFor } from '../../../public/module/k8s';
import { CreateYAML, CreateYAMLProps } from '../../../public/components/create-yaml';
import { testClusterServiceVersion, testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';

describe(CreateCRDYAML.displayName, () => {
  let wrapper: ShallowWrapper<CreateCRDYAMLProps>;

  beforeEach(() => {
    wrapper = shallow(<CreateCRDYAML match={{isExact: true, url: '', path: '', params: {ns: 'default', appName: 'example', plural: referenceFor(testResourceInstance)}}} />);
  });

  it('renders a `Firehose` for the ClusterServiceVersion', () => {
    expect(wrapper.find<any>(Firehose).props().resources).toEqual([
      {kind: referenceForModel(ClusterServiceVersionModel), name: 'example', namespace: 'default', isList: false, prop: 'ClusterServiceVersion'}
    ]);
  });

  it('renders YAML editor component', () => {
    wrapper = wrapper.setProps({ClusterServiceVersion: {loaded: true, data: _.cloneDeep(testClusterServiceVersion)}} as any);

    expect(wrapper.find(Firehose).childAt(0).dive().find(CreateYAML).exists()).toBe(true);
  });

  it('passes example YAML template to `CreateYAML` component using annotations on the ClusterServiceVersion', () => {
    let data = _.cloneDeep(testClusterServiceVersion);
    data.metadata.annotations = {'alm-examples': JSON.stringify([testResourceInstance])};
    wrapper = wrapper.setProps({ClusterServiceVersion: {loaded: true, data}} as any);

    const createYAML = wrapper.find(Firehose).childAt(0).dive<CreateYAMLProps, {}>();

    expect(createYAML.props().template).toEqual(safeDump(testResourceInstance));
  });

  it('does not render YAML editor component if ClusterServiceVersion has not loaded yet', () => {
    wrapper = wrapper.setProps({ClusterServiceVersion: {loaded: false}} as any);

    expect(wrapper.find(Firehose).childAt(0).dive().find(CreateYAML).exists()).toBe(false);
    expect(wrapper.find(Firehose).childAt(0).dive().find(LoadingBox).exists()).toBe(true);
  });
});
