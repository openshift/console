import { ExpectedConditions as by, element } from 'protractor';

export const resourceDeployment = element(by.id('form-radiobutton-kubernetes-field'));
export const resourceDeploymentConfig = element(by.id('form-radiobutton-openshift-field'));
export const resourceKnativeService = element(by.id('form-radiobutton-knative-field'));

export const selectResourceDeployment = async (resourceSelected: string) => {
  if (resourceSelected === 'Deployment') {
    await resourceDeployment.click();
  }
  if (resourceSelected === 'Deployment Config') {
    await resourceDeploymentConfig.click();
  }
  if (resourceSelected === 'Knative Service') {
    await resourceKnativeService.click();
  }
};
