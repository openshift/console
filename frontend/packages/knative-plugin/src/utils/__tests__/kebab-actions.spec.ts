import { ServiceModel } from '@console/internal/models';
import {
  ModifyApplication,
  EditApplication,
  EditHealthCheck,
} from '@console/dev-console/src/actions/modify-application';
import { getKebabActionsForKind } from '../kebab-actions';
import { setTrafficDistribution } from '../../actions/traffic-splitting';
import { setSinkSource } from '../../actions/sink-source';
import { EventSourceContainerModel, ServiceModel as knSvcModel } from '../../models';

describe('kebab-actions: ', () => {
  it('kebab action should have "Edit Application Grouping" and "Move Sink" option for EventSourceContainerModel', () => {
    const modifyApplication = getKebabActionsForKind(EventSourceContainerModel);
    expect(modifyApplication).toEqual([ModifyApplication, setSinkSource]);
  });

  it('kebab action should have "setTrafficDistribution", "Edit Application Grouping" and "Edit Application" option for knSvcModel', () => {
    const modifyApplication = getKebabActionsForKind(knSvcModel);
    expect(modifyApplication).toEqual([
      ModifyApplication,
      setTrafficDistribution,
      EditHealthCheck,
      EditApplication,
    ]);
  });

  it('kebab action should not have "Edit Application Grouping" option for ServiceModel', () => {
    const modifyApplication = getKebabActionsForKind(ServiceModel);
    expect(modifyApplication).toEqual([]);
  });
});
