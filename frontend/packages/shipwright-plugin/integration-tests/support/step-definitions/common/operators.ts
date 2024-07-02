import { Given } from 'cypress-cucumber-preprocessor/steps';
import {
  installPipelinesOperatorUsingCLI,
  installShipwrightOperatorUsingCLI,
  verifyAndInstallKnativeOperator,
} from '@console/dev-console/integration-tests/support/pages';

Given('user has installed OpenShift Pipelines Operator', () => {
  installPipelinesOperatorUsingCLI();
});

Given('user has installed OpenShift Serverless Operator', () => {
  verifyAndInstallKnativeOperator();
});

Given('user has installed Shipwright Operator', () => {
  installShipwrightOperatorUsingCLI();
});
