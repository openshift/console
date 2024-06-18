import { operatorNamespaces, operatorSubscriptions, operators } from '../../constants/global';

export const checkPipelineOperatorStatus = (retries: number = 5) => {
  const namespace = operatorNamespaces.PipelinesOperator;
  const resourceName = operatorSubscriptions.PipelinesOperator;
  if (retries === 0) {
    cy.log('Failed to install Pipelines Operator - Pod timeout');
  }

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
};

export const performPostInstallationSteps = (operator: operators): void => {
  switch (operator) {
    case operators.PipelinesOperator:
      cy.log(`Performing Pipelines post-installation steps`);
      checkPipelineOperatorStatus();
      break;
    default:
      cy.log(`Nothing to do in post-installation steps`);
  }
};

export const checkOperatorStatus = (operator: operators) => {
  switch (operator) {
    case operators.PipelinesOperator:
      checkPipelineOperatorStatus();
      break;
    default:
      cy.log('Invalid Operator');
  }
};

export const installOperatorUsingCLI = (operator: operators) => {
  let yamlFile;
  switch (operator) {
    case operators.PipelinesOperator:
      yamlFile =
        '../../pipelines-plugin/integration-tests/testData/pipelinesOperatorSubscription.yaml';
      break;
    default:
      cy.log('Invalid Operator');
  }

  cy.exec(`oc apply -f ${yamlFile}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout || result.stderr);
  });

  performPostInstallationSteps(operator);
};

export const checkSubscriptionStatus = (operator: operators) => {
  let namespace;
  let subscriptionName;
  const resourceName = 'subscriptions.operators.coreos.com';
  const condition = 'CatalogSourcesUnhealthy=false';

  switch (operator) {
    case operators.PipelinesOperator:
      namespace = operatorNamespaces.PipelinesOperator;
      subscriptionName = operatorSubscriptions.PipelinesOperator;
      break;
    default:
      cy.log('Invalid Operator');
  }

  cy.exec(
    `oc wait ${resourceName} --for=condition=${condition} --timeout=20m -n ${namespace} ${subscriptionName}`,
    {
      failOnNonZeroExit: false,
    },
  ).then(function (result) {
    if (result.stdout.includes('condition met')) {
      cy.log(`${operator} is installed in cluster, check operator status.`);
      checkOperatorStatus(operator);
    } else {
      cy.log(`${operator} not installed, installing...`);
      installOperatorUsingCLI(operator);
    }
  });
};

export const verifyAndInstallOperatorUsingCLI = (operator: operators) => {
  checkSubscriptionStatus(operator);
};

export const installPipelinesOperatorUsingCLI = () => {
  verifyAndInstallOperatorUsingCLI(operators.PipelinesOperator);
};
