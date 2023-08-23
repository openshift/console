import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { safeLoad, safeDump } from 'js-yaml';
import * as useExtensionsModule from '@console/plugin-sdk/src/api/useExtensions';

import { CreateYAML, CreateYAMLProps, CreateYAMLInner } from '../../public/components/create-yaml';
import { PodModel } from '../../public/models';
import { getYAMLTemplates } from '../../public/models/yaml-templates';
import { AsyncComponent, LoadingBox } from '../../public/components/utils';
import { referenceForModel } from '../../public/module/k8s';

describe(CreateYAML.displayName, () => {
  let wrapper: ShallowWrapper<CreateYAMLProps>;

  beforeEach(() => {
    spyOn(useExtensionsModule, 'useExtensions').and.returnValue([]);
    const params = { ns: 'default', plural: 'pods' };
    wrapper = shallow(<CreateYAMLInner params={params} kindsInFlight={false} kindObj={PodModel} />);
  });

  it('renders loading box if `props.kindsInFlight` is true', () => {
    wrapper = wrapper.setProps({ kindObj: null, kindsInFlight: true });

    expect(wrapper.find(AsyncComponent).exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('renders `AsyncComponent` which loads `EditYAML', () => {
    expect(wrapper.find(AsyncComponent).exists()).toBe(true);
  });

  it('uses `props.template` to create sample object if given', () => {
    const templateObj = { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'cool-app' } };
    const expectedObj = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'cool-app', namespace: 'default' },
    };
    wrapper = wrapper.setProps({ template: safeDump(templateObj) });

    expect(wrapper.find(AsyncComponent).props().initialResource).toEqual(expectedObj);
  });

  it('creates sample object using default YAML template for model', () => {
    const expectedObj = safeLoad(
      getYAMLTemplates().getIn([referenceForModel(PodModel), 'default']),
    );
    expectedObj.metadata.namespace = 'default';

    expect(wrapper.find(AsyncComponent).props().initialResource).toEqual(expectedObj);
  });
});
