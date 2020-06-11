import { DeploymentModel } from '@console/internal/models';
import { ServiceModel } from '@console/knative-plugin';
import { knativeServiceObj } from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';
import { sampleDeployments } from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import { EditApplication } from '../modify-application';

describe('modify application edit flow', () => {
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

  it('expect EditApplication to return hidden true for Deployments without annotations', () => {
    const editAppData = EditApplication(DeploymentModel, sampleDeployments.data[0]);
    expect(editAppData.hidden).toBe(true);
  });

  it('expect EditApplication to return hidden false for Deployments with annotations', () => {
    const sampleDeploymentWithAnnoations = {
      ...sampleDeployments.data[0],
      metadata: {
        ...sampleDeployments.data[0].metadata,
        annotations: {
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
    };
    const editAppData = EditApplication(DeploymentModel, sampleDeploymentWithAnnoations);
    expect(editAppData.hidden).toBe(false);
  });
});
