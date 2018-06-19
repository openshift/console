/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { DetailsPage, DetailsPageProps } from '../../../public/components/factory/details';
import { PodModel, ConfigMapModel } from '../../../public/models';
import { referenceForModel } from '../../../public/module/k8s';
import { Firehose } from '../../../public/components/utils';

describe(DetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<DetailsPageProps>;

  beforeEach(() => {
    const match = {params: {ns: 'default'}, isExact: true, path: '', url: ''};

    wrapper = shallow(<DetailsPage match={match} name="test-name" namespace="default" kind={referenceForModel(PodModel)} pages={[]} />);
  });

  it('renders a `Firehose` using the given props', () => {
    expect(wrapper.find<any>(Firehose).props().resources[0]).toEqual({
      kind: referenceForModel(PodModel),
      name: 'test-name',
      namespace: 'default',
      isList: false,
      prop: 'obj',
    });
  });

  it('adds extra resources to `Firehose` if provided in props', () => {
    const resources = [{
      kind: referenceForModel(ConfigMapModel),
      name: 'test-configmap',
      namespace: 'kube-system',
      isList: false,
      prop: 'configMap',
    }];
    wrapper = wrapper.setProps({resources});

    expect(wrapper.find<any>(Firehose).props().resources.length).toEqual(resources.length + 1);
    resources.forEach((resource, i) => {
      expect(wrapper.find<any>(Firehose).props().resources[i + 1]).toEqual(resource);
    });
  });
});
