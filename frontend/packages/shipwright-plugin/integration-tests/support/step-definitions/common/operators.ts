import { Given } from 'cypress-cucumber-preprocessor/steps';
import { operators } from '@console/dev-console/integration-tests/support/constants/global';
import { verifyAndInstallOperator } from '@console/dev-console/integration-tests/support/pages';

Given('user has installed OpenShift Pipelines Operator', () => {
  verifyAndInstallOperator(operators.PipelinesOperator);
});

Given('user has installed Shipwright Operator', () => {
  verifyAndInstallOperator(operators.ShipwrightOperator);
});
