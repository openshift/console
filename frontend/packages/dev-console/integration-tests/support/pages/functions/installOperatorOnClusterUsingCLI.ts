import {
  operatorNamespaces,
  operatorSubscriptions,
  operatorPackage,
  operators,
} from '../../constants/global';
import { checkOperatorvailabilityStatus } from './checkOperatorHub';
import {
  checkPipelineOperatorStatus,
  checkKnativeOperatorStatus,
  checkShipwrightOperatorStatus,
  checkBuildsForOpenshiftOperatorStatus,
  checkWebterminalOperatorStatus,
  checkRedHatIntegrationCamelKOperatorStatus,
  checkDevWorkspaceOperatorStatus,
} from './checkOperatorStatus';
import {
  createKnativeEventingUsingCLI,
  createKnativeKafkaUsingCLI,
  createKnativeServingUsingCLI,
} from './knativeSubscriptions';
import {
  checkShipwrightBuildStatus,
  createBuildsForOpenshiftBuildUsingCLI,
  createClusterBuildStrategiesUsingCLI,
  createShipwrightBuildUsingCLI,
} from './shipwrightSubscriptions';

export const checkOperatorStatus = (operator: operators) => {
  switch (operator) {
    case operators.PipelinesOperator:
      checkPipelineOperatorStatus();
      break;
    case operators.ServerlessOperator:
      checkKnativeOperatorStatus();
      break;
    case operators.ShipwrightOperator:
      checkShipwrightOperatorStatus();
      break;
    case operators.BuildsForOpenshiftOperator:
      checkBuildsForOpenshiftOperatorStatus();
      break;
    case operators.WebTerminalOperator:
      checkWebterminalOperatorStatus();
      break;
    case operators.DevWorkspaceOperator:
      checkDevWorkspaceOperatorStatus();
      break;
    case operators.RedHatIntegrationCamelK:
      checkRedHatIntegrationCamelKOperatorStatus();
      break;
    default:
      throw new Error('Invalid Operator');
  }
};

export const performPostInstallationSteps = (operator: operators): void => {
  cy.log(`Performing ${operator} post-installation steps`);
  switch (operator) {
    case operators.PipelinesOperator:
      checkPipelineOperatorStatus();
      break;
    case operators.ServerlessOperator:
      cy.wait(40000);
      createKnativeServingUsingCLI();
      createKnativeEventingUsingCLI();
      createKnativeKafkaUsingCLI();
      break;
    case operators.ShipwrightOperator:
      checkOperatorStatus(operators.ShipwrightOperator);
      checkOperatorStatus(operators.PipelinesOperator);
      createShipwrightBuildUsingCLI();
      break;
    case operators.BuildsForOpenshiftOperator:
      checkOperatorStatus(operators.BuildsForOpenshiftOperator);
      checkOperatorStatus(operators.PipelinesOperator);
      createBuildsForOpenshiftBuildUsingCLI();
      checkShipwrightBuildStatus();
      createClusterBuildStrategiesUsingCLI();
      break;
    case operators.WebTerminalOperator:
      checkWebterminalOperatorStatus();
      break;
    default:
      cy.log(`Nothing to do in post-installation steps`);
  }
};

export const installOperatorUsingCLI = (operator: operators) => {
  let yamlFile;
  switch (operator) {
    case operators.PipelinesOperator:
      yamlFile =
        '../../pipelines-plugin/integration-tests/testData/pipelinesOperatorSubscription.yaml';
      break;
    case operators.ServerlessOperator:
      yamlFile =
        '../../knative-plugin/integration-tests/testData/serverlessOperatorSubscription.yaml';
      break;
    case operators.ShipwrightOperator:
      yamlFile =
        '../../shipwright-plugin/integration-tests/testData/shipwrightOperatorSubscription.yaml';
      break;
    case operators.BuildsForOpenshiftOperator:
      yamlFile =
        '../../shipwright-plugin/integration-tests/testData/buildsForOpenshiftOperatorInstallation/buildsSubscription.yaml';
      break;
    case operators.DevWorkspaceOperator:
      yamlFile =
        '../../webterminal-plugin/integration-tests/testData/devworkspaceOperatorSubscription.yaml';
      break;
    case operators.WebTerminalOperator:
      yamlFile =
        '../../webterminal-plugin/integration-tests/testData/webterminalOperatorSubscription.yaml';
      break;
    case operators.RedHatIntegrationCamelK:
      yamlFile =
        '../../knative-plugin/integration-tests/testData/redhatCamelkOperatorSubscription.yaml';
      break;
    default:
      throw new Error('Invalid Operator');
  }

  cy.exec(`oc apply -f ${yamlFile}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    if (result.stderr) {
      throw new Error(result.stderr);
    } else {
      cy.log(result.stdout);
    }
  });

  performPostInstallationSteps(operator);
};

export const checkSubscriptionStatus = (operator: operators) => {
  let namespace;
  let subscriptionName;
  let operatorPackageName;
  const resourceName = 'subscriptions.operators.coreos.com';
  const condition = 'CatalogSourcesUnhealthy=false';

  switch (operator) {
    case operators.PipelinesOperator:
      operatorPackageName = operatorPackage.PipelinesOperator;
      namespace = operatorNamespaces.PipelinesOperator;
      subscriptionName = operatorSubscriptions.PipelinesOperator;
      break;
    case operators.ServerlessOperator:
      operatorPackageName = operatorPackage.ServerlessOperator;
      namespace = operatorNamespaces.ServerlessOperator;
      subscriptionName = operatorSubscriptions.ServerlessOperator;
      break;
    case operators.ShipwrightOperator:
      operatorPackageName = operatorPackage.ShipwrightOperator;
      namespace = operatorNamespaces.ShipwrightOperator;
      subscriptionName = operatorSubscriptions.ShipwrightOperator;
      break;
    case operators.BuildsForOpenshiftOperator:
      operatorPackageName = operatorPackage.BuildsForOpenshiftOperator;
      namespace = operatorNamespaces.BuildsForOpenshiftOperator;
      subscriptionName = operatorSubscriptions.BuildsForOpenshiftOperator;
      break;
    case operators.DevWorkspaceOperator:
      operatorPackageName = operatorPackage.DevWorkspaceOperator;
      namespace = operatorNamespaces.DevWorkspaceOperator;
      subscriptionName = operatorSubscriptions.DevWorkspaceOperator;
      break;
    case operators.WebTerminalOperator:
      operatorPackageName = operatorPackage.WebTerminalOperator;
      namespace = operatorNamespaces.WebTerminalOperator;
      subscriptionName = operatorSubscriptions.WebTerminalOperator;
      break;
    case operators.RedHatIntegrationCamelK:
      operatorPackageName = operatorPackage.RedHatIntegrationCamelK;
      namespace = operatorNamespaces.RedHatIntegrationCamelK;
      subscriptionName = operatorSubscriptions.RedHatIntegrationCamelK;
      break;
    default:
      throw new Error('Invalid Operator');
  }

  cy.exec(
    `oc wait ${resourceName} --for=condition=${condition} --timeout=10m -n ${namespace} ${subscriptionName}`,
    {
      failOnNonZeroExit: false,
    },
  ).then(function (result) {
    if (result.stdout.includes('condition met')) {
      cy.log(`${operator} is installed in cluster, check operator status.`);
      checkOperatorStatus(operator);
    } else {
      cy.log(`${operator} not installed, installing...`);
      checkOperatorvailabilityStatus(operatorPackageName);
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

export const installKnativeOperatorUsingCLI = () => {
  verifyAndInstallOperatorUsingCLI(operators.ServerlessOperator);
};

export const installShipwrightOperatorUsingCLI = () => {
  verifyAndInstallOperatorUsingCLI(operators.ShipwrightOperator);
};

export const installBuildsForOpenshiftOperatorUsingCLI = () => {
  verifyAndInstallOperatorUsingCLI(operators.BuildsForOpenshiftOperator);
};

export const installWebterminalOperatorUsingCLI = () => {
  // verifyAndInstallOperatorUsingCLI(operators.DevWorkspaceOperator);
  verifyAndInstallOperatorUsingCLI(operators.WebTerminalOperator);
};

export const installRedHatIntegrationCamelKOperatorUsingCLI = () => {
  verifyAndInstallOperatorUsingCLI(operators.RedHatIntegrationCamelK);
};
