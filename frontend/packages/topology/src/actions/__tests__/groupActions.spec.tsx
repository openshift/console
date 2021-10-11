import {
  allCatalogImageResourceAccess,
  allImportResourceAccess,
} from '@console/dev-console/src/actions/add-resources';
import { knativeTopologyDataModel } from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';
import { topologyDataModel } from '../../__tests__/topology-test-data';
import OdcBaseNode from '../../elements/OdcBaseNode';
import { GraphData, OdcNodeModel, TopologyApplicationObject } from '../../topology-types';
import { groupActions } from '../groupActions';

describe('groupActions: ', () => {
  const connectorSource = new OdcBaseNode();
  const graphData: GraphData = {
    eventSourceEnabled: false,
    namespace: 'namespace',
    createResourceAccess: [allCatalogImageResourceAccess, allImportResourceAccess],
  };
  const application: TopologyApplicationObject = {
    id: 'app-test-id-123',
    name: 'application-1',
    resources: [topologyDataModel.nodes[0]],
  };
  it('should return the correct menu and sub menu items when all permissions are allowed', () => {
    const actions = groupActions(graphData, application);
    expect(actions).toHaveLength(4);
    expect(actions.filter((a) => !a.pathKey)).toHaveLength(1);
    expect(
      actions.filter((action) => action.pathKey === `devconsole~Add to Application`),
    ).toHaveLength(3);
  });

  it('should return the correct menu items when import permissions are allowed', () => {
    const graphDataWithImportPermissions: GraphData = {
      ...graphData,
      createResourceAccess: [allImportResourceAccess],
    };
    const actions = groupActions(graphDataWithImportPermissions, application);
    expect(actions).toHaveLength(2);
  });

  it('should not return sub menu when connector source is passed', () => {
    connectorSource.setData(topologyDataModel.nodes[0].data);
    connectorSource.setResource((topologyDataModel.nodes[0] as OdcNodeModel).resource);
    const actions = groupActions(graphData, application, connectorSource);
    expect(actions).toHaveLength(3);
    expect(actions.filter((a) => a.path)).toHaveLength(0);
  });

  it('should return event source menu item when event source is enabled', () => {
    const graphDataWithEventSourceEnabled: GraphData = {
      ...graphData,
      eventSourceEnabled: true,
    };
    connectorSource.setData(
      knativeTopologyDataModel.topology['e187afa2-53b1-406d-a619-cf9ff1468031'],
    );
    const actions = groupActions(graphDataWithEventSourceEnabled, application, connectorSource);
    expect(actions).toHaveLength(4);
  });

  it('should not return event source menu item when event source is enabled and context is not knative service', () => {
    const graphDataWithEventSourceEnabled: GraphData = {
      ...graphData,
      eventSourceEnabled: true,
    };
    connectorSource.setData(application.resources[0]);
    const actions = groupActions(graphDataWithEventSourceEnabled, application, connectorSource);
    expect(actions).toHaveLength(3);
    expect(actions.filter((a) => a.label === 'Event Source')).toHaveLength(0);
  });

  it('should return serverless menu items when eventing and serving is enabled', () => {
    const graphDataWithEventSourceEnabled: GraphData = {
      ...graphData,
      eventSourceEnabled: true,
    };
    const actions = groupActions(graphDataWithEventSourceEnabled, application);
    expect(actions).toHaveLength(7);
    expect(actions.filter((a) => !!a.labelKey.match(/(Event Source|Broker|Channel)/))).toHaveLength(
      3,
    );
  });
});
