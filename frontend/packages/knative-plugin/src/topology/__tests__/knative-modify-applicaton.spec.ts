import { ServiceModel } from '@console/knative-plugin';
import { knativeServiceObj } from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';
import { EditApplication } from '@console/topology/src/actions';

describe('knative modify application edit flow', () => {
  it('expect EditApplication to return hidden false for knative service without annotations', () => {
    const editAppData = EditApplication(ServiceModel, knativeServiceObj);
    expect(editAppData.hidden).toBe(false);
  });

  it('expect EditApplication to return hidden false for knative service with annotations', () => {
    const knativeServiceObjWithAnnoations = {
      ...knativeServiceObj,
      metadata: {
        ...knativeServiceObj.metadata,
        annotations: {
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
    };
    const editAppData = EditApplication(ServiceModel, knativeServiceObjWithAnnoations);
    expect(editAppData.hidden).toBe(false);
  });
});
