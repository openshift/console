/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { ALMSpecDescriptors } from '../../../../public/components/cloud-services';
import { ClusterServiceVersionResourceSpec, SpecDescriptorProps } from '../../../../public/components/cloud-services/spec-descriptors';
import { testResourceInstance } from '../../../../__mocks__/k8sResourcesMocks';

describe(ClusterServiceVersionResourceSpec.name, () => {
  let wrapper: ShallowWrapper<SpecDescriptorProps>;

  it('renders a resource spec control', () => {
    const specDescriptor = {
      'path': '',
      'displayName': 'Some Spec Control',
      'description': '',
      'x-descriptors': [ALMSpecDescriptors.podCount]
    };

    const resourceDefinition = {
      abbr: '',
      kind: '',
      label: '',
      labelPlural: '',
      path: '',
      plural: '',
      apiVersion: 'v1',
    };

    const specValue = 124;
    wrapper = shallow(<ClusterServiceVersionResourceSpec kindObj={resourceDefinition} resource={testResourceInstance} namespace="foo" specDescriptor={specDescriptor} specValue={specValue} />);
    const link = wrapper.find('a');

    expect(link.exists()).toBe(true);
    expect(link.text()).toBe('124 pods');
  });
});
