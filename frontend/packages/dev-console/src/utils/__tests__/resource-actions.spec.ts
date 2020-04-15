import { DeploymentConfigModel, ReplicaSetModel } from '@console/internal/models';
import { getResourceActions } from '../resource-actions';
import { ModifyApplication, EditApplication } from '../../actions/modify-application';

describe('kebab-actions: ', () => {
  it('kebab action should have "Edit Application Grouping" and "Edit Application" option for deploymentConfig', () => {
    const modifyApplication = getResourceActions(DeploymentConfigModel);
    expect(modifyApplication).toEqual([ModifyApplication, EditApplication]);
  });

  it('kebab action should not have "Edit Application Grouping" option for replicaSet', () => {
    const modifyApplication = getResourceActions(ReplicaSetModel);
    expect(modifyApplication).toEqual([]);
  });
});
