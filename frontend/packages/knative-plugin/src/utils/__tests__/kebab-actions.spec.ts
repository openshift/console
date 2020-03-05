import { ServiceModel } from '@console/internal/models';
import {
  ModifyApplication,
  EditApplication,
} from '@console/dev-console/src/actions/modify-application';
import { getKebabActions } from '../kebab-actions';
import { setTrafficDistribution } from '../../actions/traffic-splitting';
import { setSinkSource } from '../../actions/sink-source';
import { EventSourceContainerModel, ServiceModel as knSvcModel } from '../../models';

describe('kebab-actions: ', () => {
  it('kebab action should have "Edit Application Grouping" and "Move Sink" option for EventSourceContainerModel', () => {
    const modifyApplication = getKebabActions(EventSourceContainerModel);
    expect(modifyApplication).toEqual([ModifyApplication, setSinkSource]);
  });

  it('kebab action should have "setTrafficDistribution", "Edit Application Grouping" and "Edit Application" option for knSvcModel', () => {
    const modifyApplication = getKebabActions(knSvcModel);
    expect(modifyApplication).toEqual([ModifyApplication, setTrafficDistribution, EditApplication]);
  });

  it('kebab action should not have "Edit Application Grouping" option for ServiceModel', () => {
    const modifyApplication = getKebabActions(ServiceModel);
    expect(modifyApplication).toEqual([]);
  });
});
