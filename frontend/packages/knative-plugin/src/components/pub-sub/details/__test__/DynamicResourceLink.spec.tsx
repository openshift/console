import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import DynamicResourceLink from '../DynamicResourceLink';

type DynamicResourceLinkProps = React.ComponentProps<typeof DynamicResourceLink>;
let sampleProps: DynamicResourceLinkProps;
let wrapper: ShallowWrapper<DynamicResourceLinkProps>;

describe('DynamicResourceLink', () => {
  beforeEach(() => {
    sampleProps = {
      title: 'Subscriber',
      name: 'sample-name',
      namespace: 'sample-app',
      kind: 'serving.knative.dev~v1~Service',
    };
  });

  it('should render ResourceLink with proper kind based on model', () => {
    wrapper = shallow(<DynamicResourceLink {...sampleProps} />);
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(wrapper.find(ResourceLink).props().kind).toEqual('serving.knative.dev~v1~Service');
  });

  it('should render ResourceLink with proper kind based on refResource', () => {
    const sampleResourceRef = {
      ...sampleProps,
      refResource: {
        apiVersion: 'serving.knative.dev/v1',
        kind: 'Service',
        name: 'ksvc-display0',
      },
    };
    wrapper = shallow(<DynamicResourceLink {...sampleResourceRef} />);
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(wrapper.find(ResourceLink).props().kind).toEqual('serving.knative.dev~v1~Service');
  });
});
