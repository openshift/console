import * as React from 'react';
import { shallow } from 'enzyme';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { TYPE_SERVICE_BINDING, TYPE_TRAFFIC_CONNECTOR } from '../../../const';
import TopologyEdgeResourcesPanel from '../TopologyEdgeResourcesPanel';
import { source, target, serviceBinding } from './topology-edge-resources-panel-data';

const mockEdge = {
  type: 'service-binding',
  data: {
    sbr: serviceBinding,
  },
  id: '766693ad-dbfb-4ace-b9da-f1c119f8b6fa_12c9dbe0-9d9c-4a4d-9c2a-538b0b59322a',
  getSource: jest.fn().mockReturnValue({
    getResource: jest.fn().mockReturnValue(source),
  }),
  getTarget: jest.fn().mockReturnValue({
    getResource: jest.fn().mockReturnValue(target),
  }),
  getData: jest.fn().mockReturnValue({
    sbr: serviceBinding,
  }),
  getType: jest.fn().mockReturnValue(TYPE_SERVICE_BINDING),
};

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('TopologyEdgeResourcesPanel', () => {
  beforeEach(() => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([[], true]);
  });

  it('should show the source and target links', () => {
    const wrapper = shallow(<TopologyEdgeResourcesPanel edge={mockEdge as any} />);
    expect(wrapper.find('[text="Connections"]').exists()).toBe(true);
    expect(wrapper.find('[dataTest="resource-link-spring-petclinic-rest"]').exists()).toBe(true);
    expect(wrapper.find('[dataTest="resource-link-hippo"]').exists()).toBe(true);
  });

  it('should show the binding secret link if secret is available', () => {
    const wrapper = shallow(<TopologyEdgeResourcesPanel edge={mockEdge as any} />);
    expect(wrapper.find('[text="Secret"]').exists()).toBe(true);
    expect(
      wrapper
        .find('[dataTest="secret-resource-link-spring-petclinic-rest-d-hippo-pc-2d428a0c"]')
        .exists(),
    ).toBe(true);
  });

  it('should show sink uri(s) in case of event source', () => {
    mockEdge.getSource.mockReturnValue({
      getResource: jest.fn().mockReturnValue({
        ...source,
        spec: { ...source.spec, sinkUri: 'spring-petclinic-rest' },
      }),
    });

    mockEdge.getTarget.mockReturnValue({
      getResource: jest.fn().mockReturnValue({
        ...target,
        spec: { ...target.spec, sinkUri: 'hippo' },
      }),
    });

    const wrapper = shallow(<TopologyEdgeResourcesPanel edge={mockEdge as any} />);
    expect(wrapper.find('[dataTestID="sink-uri-spring-petclinic-rest"]').exists()).toBe(true);
    expect(wrapper.find('[dataTestID="sink-uri-hippo"]').exists()).toBe(true);
  });

  it('should show the kiali link in case of traffic connector', () => {
    mockEdge.getType.mockReturnValue(TYPE_TRAFFIC_CONNECTOR);
    const wrapper = shallow(<TopologyEdgeResourcesPanel edge={mockEdge as any} />);
    expect(wrapper.find('[text="Kiali link"]').exists()).toBe(true);
    expect(wrapper.find('[dataTestID="kiali-link"]').exists()).toBe(true);
  });
});
