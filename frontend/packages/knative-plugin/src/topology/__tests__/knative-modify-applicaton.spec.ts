import { EditKsvc, ServiceModel } from '@console/knative-plugin';
import { knativeServiceObj } from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';

describe('knative modify application edit flow', () => {
  it('expect EditApplication to not be hidden for knative service', () => {
    const editAppData = EditKsvc(ServiceModel, knativeServiceObj);
    expect(editAppData.hidden).toBeUndefined();
  });
});
