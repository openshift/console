import { operatorNamespaces, operatorSubscriptions } from '../../constants/global';

export const checkShipwrightOperatorStatus = (retries: number = 5) => {
  const namespace = operatorNamespaces.ShipwrightOperator;
  const resourceName = operatorSubscriptions.ShipwrightOperator;
  if (retries === 0) {
    throw new Error('Failed to install Shipwright Operator - Pod timeout');
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
        checkShipwrightOperatorStatus(retries - 1);
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

export const checkKnativeOperatorStatus = () => {
  const checkInstanceStatus = (resourceName: string, instanceName: string, namespace: string) => {
    cy.exec(
      `oc wait ${resourceName} --for=condition=Ready --timeout=2m -n ${namespace} ${instanceName}`,
      {
        failOnNonZeroExit: false,
      },
    ).then(function (result) {
      if (result.stdout.includes('condition met')) {
        cy.log(result.stdout);
      } else {
        throw new Error(result.stderr);
      }
    });
  };
  const checkKnativeServingStatus = () => {
    const namespace = 'knative-serving';
    const instanceName = 'knative-serving';
    const resourceName = 'KnativeServing';
    checkInstanceStatus(resourceName, instanceName, namespace);
  };

  const checkKnativeEventingStatus = () => {
    const namespace = 'knative-eventing';
    const instanceName = 'knative-eventing';
    const resourceName = 'KnativeEventing';
    checkInstanceStatus(resourceName, instanceName, namespace);
  };

  const checkKnativeKafkaStatus = () => {
    const namespace = 'knative-eventing';
    const instanceName = 'knative-kafka';
    const resourceName = 'KnativeKafka';
    checkInstanceStatus(resourceName, instanceName, namespace);
  };

  checkKnativeServingStatus();
  checkKnativeEventingStatus();
  checkKnativeKafkaStatus();
};
