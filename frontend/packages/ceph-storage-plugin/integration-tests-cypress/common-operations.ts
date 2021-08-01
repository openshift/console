export const scaleDeployments = (resources: string[], replicas: number) =>
  resources.forEach((resource) => {
    cy.exec(`oc scale --replicas=${replicas} deploy ${resource} -n openshift-storage`);
  });
