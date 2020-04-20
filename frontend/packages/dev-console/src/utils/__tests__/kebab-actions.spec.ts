import { DeploymentConfigModel, ReplicaSetModel } from '@console/internal/models';
import { ModifyHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { getKebabActionsForKind } from '../kebab-actions';
import { ModifyApplication, EditApplication } from '../../actions/modify-application';

describe('kebab-actions: ', () => {
  it('kebab action should have "Edit Application Grouping", "Edit Application" and "Edit Health Checks" option for deploymentConfig', () => {
    const modifyApplication = getKebabActionsForKind(DeploymentConfigModel);
    expect(modifyApplication).toEqual([ModifyApplication, ModifyHealthChecks, EditApplication]);
  });

  it('kebab action should not have "Edit Application Grouping" option for replicaSet', () => {
    const modifyApplication = getKebabActionsForKind(ReplicaSetModel);
    expect(modifyApplication).toEqual([]);
  });
});
