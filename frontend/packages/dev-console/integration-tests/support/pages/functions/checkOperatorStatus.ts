import { operatorNamespaces, operatorSubscriptions } from '../../constants';

export const checkRedHatIntegrationCamelKOperatorStatus = (retries: number = 5) => {
  const namespace = operatorNamespaces.RedHatIntegrationCamelK;
  const resourceName = 'camel-k-operator';
  if (retries === 0) {
    throw new Error('Failed to install Red Hat Camel K Operator - Pod timeout');
  } else {
    cy.exec(
      `oc wait --for=condition=ready pod -l name=${resourceName} -n ${namespace} --timeout=300s`,
      {
        failOnNonZeroExit: false,
      },
    ).then(function (result) {
      if (result.stdout.includes('condition met')) {
        cy.log(`Success: ${result.stdout}`);
      } else {
        cy.log(result.stderr);
        cy.wait(30000);
        checkRedHatIntegrationCamelKOperatorStatus(retries - 1);
      }
    });
  }
};

export const checkPipelineOperatorStatus = (retries: number = 5) => {
  const namespace = operatorNamespaces.PipelinesOperator;
  const resourceName = operatorSubscriptions.PipelinesOperator;
  if (retries === 0) {
    throw new Error('Failed to install Pipelines Operator - Pod timeout');
  } else {
    cy.exec(
      `oc wait --for=condition=ready pod -l app=${resourceName} -n ${namespace} --timeout=300s`,
      {
        failOnNonZeroExit: false,
      },
    ).then(function (result) {
      if (result.stdout.includes('condition met')) {
        cy.log(`Success: ${result.stdout}`);
      } else {
        cy.log(result.stderr);
        cy.wait(30000);
        checkPipelineOperatorStatus(retries - 1);
      }
    });
  }
};
