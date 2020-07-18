import { knativeTopologyDataModel } from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';
import { topologyDataModel } from '../../__tests__/topology-test-data';
import {
  allCatalogImageResourceAccess,
  allImportResourceAccess,
} from '../../../../actions/add-resources';
import { GraphData } from '../../topology-types';
import { graphActions } from '../graphActions';
import { OdcBaseNode } from '../../elements/OdcBaseNode';

describe('graphActions: ', () => {
  it('should return the correct menu items when all permissions are allowed', () => {
    const graphData: GraphData = {
      eventSourceEnabled: false,
      namespace: 'namespace',
      createResourceAccess: [allCatalogImageResourceAccess, allImportResourceAccess],
    };
    const actions = graphActions(graphData);
    expect(actions).toHaveLength(5);
  });

  it('should return the correct menu items when all only import resources are allowed', () => {
    const graphData: GraphData = {
      eventSourceEnabled: false,
      namespace: 'namespace',
      createResourceAccess: [allImportResourceAccess],
    };
    const actions = graphActions(graphData);
    expect(actions).toHaveLength(4);
  });

  it('should return the correct menu items when minimal resources are allowed', () => {
    const graphData: GraphData = {
      eventSourceEnabled: false,
      namespace: 'namespace',
      createResourceAccess: [],
    };
    const actions = graphActions(graphData);
    expect(actions).toHaveLength(2);
  });

  it('should return the correct menu items when connector source is passed and event source is disabled', () => {
    const graphData: GraphData = {
      eventSourceEnabled: false,
      namespace: 'namespace',
      createResourceAccess: [allCatalogImageResourceAccess, allImportResourceAccess],
    };
    const connectorSource = new OdcBaseNode();
    connectorSource.setData(topologyDataModel.nodes[0].data);
    const actions = graphActions(graphData, connectorSource);
    expect(actions).toHaveLength(3);
  });

  it('should return the event source menu item when connector source is passed and event source is enabled', () => {
    const graphData: GraphData = {
      eventSourceEnabled: true,
      namespace: 'namespace',
      createResourceAccess: [allCatalogImageResourceAccess, allImportResourceAccess],
    };
    const connectorSource = new OdcBaseNode();
    connectorSource.setData(
      knativeTopologyDataModel.topology['e187afa2-53b1-406d-a619-cf9ff1468031'],
    );
    const actions = graphActions(graphData, connectorSource);
    expect(actions).toHaveLength(4);
    expect(actions.filter((action) => action.label === 'Event Source')).toHaveLength(1);
  });
});
