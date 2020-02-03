import { ServiceModel } from '@console/internal/models';
import {
  ModifyApplication,
  EditApplication,
} from '@console/dev-console/src/actions/modify-application';
import { getKebabActionsForKind } from '../kebab-actions';
import { setTrafficDistribution } from '../../actions/traffic-splitting';
import { EventSourceContainerModel, ServiceModel as knSvcModel } from '../../models';

describe('kebab-actions: ', () => {
  it('kebab action should have "Edit Application Grouping" option for EventSourceContainerModel', () => {
    const modifyApplication = getKebabActionsForKind(EventSourceContainerModel);
    expect(modifyApplication).toEqual([ModifyApplication]);
  });

  it('kebab action should have "setTrafficDistribution", "Edit Application Grouping" and "Edit Application" option for knSvcModel', () => {
    const modifyApplication = getKebabActionsForKind(knSvcModel);
    expect(modifyApplication).toEqual([ModifyApplication, setTrafficDistribution, EditApplication]);
  });

  it('kebab action should not have "Edit Application Grouping" option for ServiceModel', () => {
    const modifyApplication = getKebabActionsForKind(ServiceModel);
    expect(modifyApplication).toEqual([]);
  });
});
