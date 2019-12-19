import * as React from 'react';
import { shallow } from 'enzyme';
import { transformTopologyData } from '../topology-utils';
import Topology from '../Topology';
import { MockGraphResources } from './graph-test-data';

const mockCheURL = 'https://mock-che.test-cluster.com';

describe('Graph', () => {
  let topologyData;
  let graphWrapper;
  let mockSelectFn;

  beforeEach(() => {
    topologyData = transformTopologyData(
      MockGraphResources,
      ['deployments', 'deploymentConfigs', 'daemonSets', 'statefulSets'],
      undefined,
      mockCheURL,
    );
    mockSelectFn = jest.fn();
    graphWrapper = shallow(<Topology data={topologyData} serviceBinding={false} />);
  });

  xit('should display the workload nodes', () => {
    expect(graphWrapper.find('.odc-base-node').length).toBe(7);
  });

  xit('should display the connectors', () => {
    expect(graphWrapper.find('.odc-base-edge').length).toBe(3);
  });

  xit('should display the groups', () => {
    expect(graphWrapper.find('.odc-default-group').length).toBe(3);
  });

  xit('should call onSelect on a node click', () => {
    const node = graphWrapper.find('.odc-base-node').first();
    const nodeEventHandler = node.find('[data-test-id="base-node-handler"]').first();
    nodeEventHandler.simulate('click');
    expect(mockSelectFn).toHaveBeenCalled();
  });

  xit('should display the create connector component on node hover', () => {
    expect(graphWrapper.find('.odc-dragging-create-connector').exists()).toBeFalsy();
    const node = graphWrapper.find('.odc-base-node').first();
    const nodeEventHandler = node.find('[data-test-id="base-node-handler"]').first();
    nodeEventHandler.simulate('mouseenter');
    expect(graphWrapper.find('.odc-dragging-create-connector').exists()).toBeTruthy();
    nodeEventHandler.simulate('mouseleave');
    expect(graphWrapper.find('.odc-dragging-create-connector').exists()).toBeFalsy();
  });

  xit('should highlight a connector on hover', () => {
    expect(graphWrapper.find('.odc-base-edge.is-hover').exists()).toBeFalsy();
    const connectorHandler = graphWrapper.find('[data-test-id="connects-to-handler"]').first();
    connectorHandler.simulate('mouseenter');
    expect(graphWrapper.find('.odc-base-edge.is-hover').exists()).toBeTruthy();
    connectorHandler.simulate('mouseleave');
    expect(connectorHandler.find('.odc-base-edge.is-hover').exists()).toBeFalsy();
  });

  xit('should display the remove icon on a connector on hover', () => {
    const connectorHandler = graphWrapper.find('[data-test-id="connects-to-handler"]').first();
    expect(graphWrapper.find('.odc-base-edge.is-hover').exists()).toBeFalsy();
    connectorHandler.simulate('mouseenter');
    expect(graphWrapper.find('.odc-connects-to__remove-bg').exists()).toBeTruthy();
    connectorHandler.simulate('mouseleave');
    expect(graphWrapper.find('.odc-base-edge.is-hover').exists()).toBeFalsy();
  });
});
