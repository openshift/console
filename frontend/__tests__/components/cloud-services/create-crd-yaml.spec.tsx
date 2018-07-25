/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash-es';
import { safeDump } from 'js-yaml';
import Spy = jasmine.Spy;

import { CreateCRDYAML, CreateCRDYAMLProps } from '../../../public/components/cloud-services/create-crd-yaml';
import { Firehose, LoadingBox } from '../../../public/components/utils';
import { ClusterServiceVersionModel } from '../../../public/models';
import { referenceForModel } from '../../../public/module/k8s';
import { CreateYAML } from '../../../public/components/create-yaml';
import { testClusterServiceVersion, testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import * as yamlTemplates from '../../../public/yaml-templates';

describe(CreateCRDYAML.displayName, () => {
  let wrapper: ShallowWrapper<CreateCRDYAMLProps>;
  let registerTemplateSpy: Spy;

  beforeEach(() => {
    registerTemplateSpy = spyOn(yamlTemplates, 'registerTemplate');

    wrapper = shallow(<CreateCRDYAML match={{isExact: true, url: '', path: '', params: {ns: 'default', appName: 'example', plural: ''}}} />);
  });

  it('renders a `Firehose` for the ClusterServiceVersion', () => {
    expect(wrapper.shallow().find(Firehose).props().resources).toEqual([
      {kind: referenceForModel(ClusterServiceVersionModel), name: 'example', namespace: 'default', isList: false, prop: 'ClusterServiceVersion'}
    ]);
  });

  it('renders YAML editor component', () => {
    const render = wrapper.find('CreateCRDYAMLFirehose').prop<Function>('render');
    wrapper = shallow(<div>{render({ClusterServiceVersion: {loaded: true, data: _.cloneDeep(testClusterServiceVersion)}})}</div>);

    expect(wrapper.childAt(0).shallow().find(CreateYAML).exists()).toBe(true);
  });

  it('registers example YAML templates using annotations on the ClusterServiceVersion', () => {
    let data = _.cloneDeep(testClusterServiceVersion);
    data.metadata.annotations = {'alm-examples': JSON.stringify([testResourceInstance])};
    const render = wrapper.find('CreateCRDYAMLFirehose').prop<Function>('render');
    wrapper = shallow(<div>{render({ClusterServiceVersion: {loaded: true, data}})}</div>);

    wrapper.childAt(0).dive();

    expect(registerTemplateSpy.calls.count()).toEqual(1);
    expect(registerTemplateSpy.calls.argsFor(0)[1]).toEqual(safeDump(testResourceInstance));
  });

  it('registers fallback example YAML template if annotations not present on ClusterServiceVersion', () => {
    const render = wrapper.find('CreateCRDYAMLFirehose').prop<Function>('render');
    wrapper = shallow(<div>{render({ClusterServiceVersion: {loaded: true, data: _.cloneDeep(testClusterServiceVersion)}})}</div>);

    wrapper.childAt(0).dive();

    expect(registerTemplateSpy.calls.count()).toEqual(1);
    expect(registerTemplateSpy.calls.argsFor(0)[1]).not.toEqual(safeDump(testResourceInstance));
  });

  it('does not render YAML editor component if ClusterServiceVersion has not loaded yet', () => {
    const render = wrapper.find('CreateCRDYAMLFirehose').prop<Function>('render');
    wrapper = shallow(<div>{render({ClusterServiceVersion: {loaded: false}})}</div>);

    expect(wrapper.childAt(0).dive().find(CreateYAML).exists()).toBe(false);
    expect(wrapper.childAt(0).dive().find(LoadingBox).exists()).toBe(true);
  });
});
