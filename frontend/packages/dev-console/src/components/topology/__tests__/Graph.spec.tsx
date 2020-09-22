import * as React from 'react';
import { mount } from 'enzyme';
import { ConnectedTopologyView } from '../TopologyView';
import { MockGraphResources } from './graph-test-data';
import { baseDataModelGetter } from '../data-transforms';

describe('Graph', () => {
  let topologyData;
  let graphWrapper;
  let mockSelectFn;

  beforeEach(() => {
    mockSelectFn = jest.fn();
    const model = { nodes: [], edges: [] };
    topologyData = baseDataModelGetter(model, 'test-project', MockGraphResources, []);
    graphWrapper = mount(
      <ConnectedTopologyView
        model={topologyData}
        namespace="test"
        showGraphView
        application={''}
        eventSourceEnabled
        onSelectTab={() => {}}
        onFiltersChange={() => {}}
        onSupportedFiltersChange={() => {}}
        onSupportedKindsChange={() => {}}
      />,
    );
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
