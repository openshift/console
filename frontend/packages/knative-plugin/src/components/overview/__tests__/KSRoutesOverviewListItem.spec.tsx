import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import { RouteModel } from '../../../models';
import KSRoutesOverviewListItem from '../KSRoutesOverviewListItem';

type KSRoutesOverviewListItemProps = React.ComponentProps<typeof KSRoutesOverviewListItem>;

describe('KSRoutesOverviewListItem', () => {
  let wrapper: ShallowWrapper<KSRoutesOverviewListItemProps>;
  beforeEach(() => {
    const [ksroute] = MockKnativeResources.ksroutes.data;
    wrapper = shallow(<KSRoutesOverviewListItem ksroute={ksroute} />);
  });

  it('should list the Route', () => {
    expect(wrapper.find('li')).toHaveLength(1);
    expect(
      wrapper
        .find('li')
        .at(0)
        .props().className,
    ).toEqual('list-group-item');
  });

  it('should have ResourceLink with proper kind', () => {
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ResourceLink)
        .at(0)
        .props().kind,
    ).toEqual(referenceForModel(RouteModel));
  });

  it('should have route ExternalLink with proper href', () => {
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ExternalLink)
        .at(0)
        .props().href,
    ).toEqual('http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com');
  });

  it('should not show the route url if it is not available', () => {
    const ksroute = { ...MockKnativeResources.ksroutes.data[0], status: { url: '' } };
    wrapper.setProps({ ksroute });
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(wrapper.find(ExternalLink)).toHaveLength(0);
  });
});
