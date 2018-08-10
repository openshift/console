/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { safeLoad, safeDump } from 'js-yaml';

import { CreateYAML, CreateYAMLProps } from '../../public/components/create-yaml';
import { PodModel } from '../../public/models';
import { yamlTemplates } from '../../public/models/yaml-templates';
import { AsyncComponent, LoadingBox } from '../../public/components/utils';
import { referenceForModel } from '../../public/module/k8s';

describe(CreateYAML.displayName, () => {
  let wrapper: ShallowWrapper<CreateYAMLProps>;

  beforeEach(() => {
    const match = {url: '', params: {ns: 'default', plural: 'pods'}, isExact: true, path: ''};
    wrapper = shallow(<CreateYAML.WrappedComponent match={match} kindsInFlight={false} kindObj={PodModel} />);
  });

  it('renders loading box if `props.kindsInFlight` is true', () => {
    wrapper = wrapper.setProps({kindObj: null, kindsInFlight: true});

    expect(wrapper.find(AsyncComponent).exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('renders `AsyncComponent` which loads `EditYAML', () => {
    expect(wrapper.find(AsyncComponent).exists()).toBe(true);
  });

  it('uses `props.template` to create sample object if given', () => {
    const templateObj = {apiVersion: 'v1', kind: 'Pod', metadata: {name: 'cool-app'}};
    const expectedObj = {apiVersion: 'v1', kind: 'Pod', metadata: {name: 'cool-app', namespace: 'default'}};
    wrapper = wrapper.setProps({template: safeDump(templateObj)});

    expect(wrapper.find(AsyncComponent).props().obj).toEqual(expectedObj);
  });

  it('creates sample object using default YAML template for model', () => {
    let expectedObj = safeLoad(yamlTemplates.getIn([referenceForModel(PodModel), 'default']));
    expectedObj.metadata.namespace = 'default';

    expect(wrapper.find(AsyncComponent).props().obj).toEqual(expectedObj);
  });
});
