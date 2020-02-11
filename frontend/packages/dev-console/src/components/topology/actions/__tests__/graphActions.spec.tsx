import {
  allCatalogImageResourceAccess,
  allImportResourceAccess,
} from '../../../../actions/add-resources';
import { GraphData } from '../../topology-types';
import { graphActions } from '../graphActions';

describe('graphActions: ', () => {
  it('should return the correct menu items when all permissions are allowed', () => {
    const graphData: GraphData = {
      namespace: 'namespace',
      createResourceAccess: [allCatalogImageResourceAccess, allImportResourceAccess],
    };
    const actions = graphActions(graphData);
    expect(actions.length).toBe(5);
  });

  it('should return the correct menu items when all only import resources are allowed', () => {
    const graphData: GraphData = {
      namespace: 'namespace',
      createResourceAccess: [allImportResourceAccess],
    };
    const actions = graphActions(graphData);
    expect(actions.length).toBe(4);
  });

  it('should return the correct menu items when minimal resources are allowed', () => {
    const graphData: GraphData = {
      namespace: 'namespace',
      createResourceAccess: [],
    };
    const actions = graphActions(graphData);
    expect(actions.length).toBe(2);
  });
});
