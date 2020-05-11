import { ServiceModel } from '@console/internal/models';
import { EditApplication } from '@console/dev-console/src/actions/modify-application';
import { referenceForModel } from '@console/internal/module/k8s';
import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { getKebabActionsForKind } from '../kebab-actions';
import { setTrafficDistribution } from '../../actions/traffic-splitting';
import { setSinkSource } from '../../actions/sink-source';
import { EventSourceContainerModel, ServiceModel as knSvcModel } from '../../models';
import * as fetchDynamicEventsource from '../fetch-dynamic-eventsources-utils';

describe('kebab-actions: ', () => {
  it('kebab action should have "Move Sink" option for EventSourceContainerModel', () => {
    jest
      .spyOn(fetchDynamicEventsource, 'getDynamicEventSourcesModelRefs')
      .mockImplementationOnce(() => [referenceForModel(EventSourceContainerModel)]);
    const eventSourceActions = getKebabActionsForKind(EventSourceContainerModel);
    expect(eventSourceActions).toEqual([setSinkSource]);
  });

  it('should return empty array if there are no eventsourceModel present', () => {
    jest
      .spyOn(fetchDynamicEventsource, 'getDynamicEventSourcesModelRefs')
      .mockImplementationOnce(() => []);
    const modifyApplication = getKebabActionsForKind(EventSourceContainerModel);
    expect(modifyApplication).toEqual([]);
  });

  it('kebab action should have "setTrafficDistribution", "Add Health Checks", "Edit Application" and "Edit Health Checks" option for knSvcModel', () => {
    const knSvcActions = getKebabActionsForKind(knSvcModel);
    expect(knSvcActions).toEqual([
      setTrafficDistribution,
      AddHealthChecks,
      EditApplication,
      EditHealthChecks,
    ]);
  });

  it('kebab action should not have options for ServiceModel', () => {
    const serviceActions = getKebabActionsForKind(ServiceModel);
    expect(serviceActions).toEqual([]);
  });
});
