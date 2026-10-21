import { operatorNamespaces, operatorSubscriptions } from '../../constants';
import {
  createKnativeEventingUsingCLI,
  createKnativeKafkaUsingCLI,
  createKnativeServingUsingCLI,
} from './knativeSubscriptions';

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

export const checkWebterminalOperatorStatus = (retries: number = 5) => {
  const namespace = operatorNamespaces.WebTerminalOperator;
  const resourceName = 'web-terminal-controller';
  if (retries === 0) {
    throw new Error('Failed to install Webterminal Operator - Pod timeout');
  } else {
    cy.exec(
      `oc wait --for=condition=ready pod -l app.kubernetes.io/name=${resourceName} -n ${namespace} --timeout=300s`,
      {
        failOnNonZeroExit: false,
      },
    ).then(function (result) {
      if (result.stdout.includes('condition met')) {
        cy.log(`Success: ${result.stdout}`);
      } else {
        cy.log(result.stderr);
        cy.wait(30000);
        checkWebterminalOperatorStatus(retries - 1);
      }
    });
  }
};

export const checkDevWorkspaceOperatorStatus = (retries: number = 5) => {
  const namespace = operatorNamespaces.DevWorkspaceOperator;
  const controllerResourceName = 'devworkspace-controller';
  const serverResourceName = 'devworkspace-webhook-server';

  if (retries === 0) {
    throw new Error('Failed to install devworkspace operator - Pod timeout');
  } else {
    cy.exec(
      `oc wait --for=condition=ready pod -l app.kubernetes.io/name=${controllerResourceName} -n ${namespace} --timeout=300s`,
      {
        failOnNonZeroExit: false,
      },
    ).then(function (result) {
      if (result.stdout.includes('condition met')) {
        cy.log(`Success: ${result.stdout}`);
      } else {
        cy.log(result.stderr);
        cy.wait(30000);
        checkDevWorkspaceOperatorStatus(retries - 1);
      }
    });
    cy.exec(
      `oc wait --for=condition=ready pod -l app.kubernetes.io/name=${serverResourceName} -n ${namespace} --timeout=300s`,
      {
        failOnNonZeroExit: false,
      },
    ).then(function (result) {
      if (result.stdout.includes('condition met')) {
        cy.log(`Success: ${result.stdout}`);
      } else {
        cy.log(result.stderr);
        cy.wait(30000);
        checkDevWorkspaceOperatorStatus(retries - 1);
      }
    });
  }
};

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

export const checkBuildsForOpenshiftOperatorStatus = (retries: number = 5) => {
  const namespace = operatorNamespaces.BuildsForOpenshiftOperator;
  const resourceName = operatorSubscriptions.BuildsForOpenshiftOperator;
  if (retries === 0) {
    throw new Error('Failed to install Builds for Openshift Operator - Pod timeout');
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
        checkBuildsForOpenshiftOperatorStatus(retries - 1);
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
      } else if (resourceName === 'KnativeServing') {
        createKnativeServingUsingCLI();
      } else if (resourceName === 'KnativeEventing') {
        createKnativeEventingUsingCLI();
      } else if (resourceName === 'KnativeKafka') {
        createKnativeKafkaUsingCLI();
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
