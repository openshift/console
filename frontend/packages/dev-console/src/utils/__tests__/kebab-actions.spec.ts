import { DeploymentConfigModel, ReplicaSetModel } from '@console/internal/models';
import { getKebabActionsForKind } from '../kebab-actions';
import { EditApplication } from '../../actions/modify-application';

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
