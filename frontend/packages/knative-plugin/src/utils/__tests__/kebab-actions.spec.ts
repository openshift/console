import { ServiceModel } from '@console/internal/models';
import { K8sKind } from '@console/internal/module/k8s';
import { setSinkSource } from '../../actions/sink-source';
import { CAMEL_APIGROUP, KNATIVE_EVENT_SOURCE_APIGROUP } from '../../const';
import * as fetchDynamicEventsource from '../fetch-dynamic-eventsources-utils';
import { getKebabActionsForKind } from '../kebab-actions';

const EventSourceContainerModel = {
  apiGroup: KNATIVE_EVENT_SOURCE_APIGROUP,
  apiVersion: 'v1',
  kind: 'ContainerSource',
} as K8sKind;

const CamelKameletBindingModel = {
  apiGroup: CAMEL_APIGROUP,
  apiVersion: 'v1alpha1',
  kind: 'KameletBinding',
} as K8sKind;

describe('kebab-actions: ', () => {
  it('kebab action should have "Move Sink" option for EventSourceContainerModel', () => {
    jest
      .spyOn(fetchDynamicEventsource, 'getDynamicEventSourcesModelRefs')
      .mockImplementationOnce(() => ['sources.knative.dev~v1~ContainerSource']);
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

  it('kebab action should not have options for ServiceModel', () => {
    const serviceActions = getKebabActionsForKind(ServiceModel);
    expect(serviceActions).toEqual([]);
  });

  it('kebab action should have "Move Sink" option for CamelKameletBindingModel', () => {
    const eventSourceActions = getKebabActionsForKind(CamelKameletBindingModel);
    expect(eventSourceActions).toEqual([setSinkSource]);
  });
});
