/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { ALMSpecDescriptors } from '../../../public/components/cloud-services';
import { ClusterServiceVersionResourceModifier, ClusterServiceVersionResourceModifierProps } from '../../../public/components/cloud-services/spec-descriptors';
import { testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';

describe(ClusterServiceVersionResourceModifier.name, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionResourceModifierProps>;

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
    };

    const specValue = 124;
    wrapper = shallow(<ClusterServiceVersionResourceModifier kindObj={resourceDefinition} resource={testResourceInstance} namespace="foo" specDescriptor={specDescriptor} specValue={specValue} />);
    const link = wrapper.find('a');

    expect(link.exists()).toBe(true);
    expect(link.text()).toBe('124 pods');
  });
});
