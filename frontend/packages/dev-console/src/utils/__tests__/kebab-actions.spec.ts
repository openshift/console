import { DeploymentConfigModel, ReplicaSetModel } from '@console/internal/models';
import { EditApplication } from '@console/topology/src/actions';
import { getKebabActionsForKind } from '../kebab-actions';

describe('kebab-actions: ', () => {
  it('kebab action should have "Edit Application" option for deploymentConfig', () => {
    const deploymentConfigActions = getKebabActionsForKind(DeploymentConfigModel);
    expect(deploymentConfigActions).toEqual([EditApplication]);
  });

  it('kebab action should not have options for replicaSet', () => {
    const replicaSetActions = getKebabActionsForKind(ReplicaSetModel);
    expect(replicaSetActions).toEqual([]);
  });
});
