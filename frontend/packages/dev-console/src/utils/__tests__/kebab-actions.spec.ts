import { DeploymentConfigModel, ReplicaSetModel } from '@console/internal/models';
import { getKebabActionsForKind } from '../kebab-actions';
import { ModifyApplication, EditApplication } from '../../actions/modify-application';

describe('kebab-actions: ', () => {
  it('kebab action should have "Edit Application Grouping", "Edit Application" and "Edit Health Checks" option for deploymentConfig', () => {
    const modifyApplication = getKebabActionsForKind(DeploymentConfigModel);
    expect(modifyApplication).toEqual([ModifyApplication, EditApplication]);
  });

  it('kebab action should not have "Edit Application Grouping" option for replicaSet', () => {
    const modifyApplication = getKebabActionsForKind(ReplicaSetModel);
    expect(modifyApplication).toEqual([]);
  });
});
