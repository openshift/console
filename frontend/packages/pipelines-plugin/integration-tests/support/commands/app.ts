import {
  navigateTo,
  verifyAndInstallPipelinesOperator,
} from '@console/dev-console/integration-tests/support/pages';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';

before(() => {
  cy.login();
  cy.visit('');
  verifyAndInstallPipelinesOperator();
});

beforeEach(() => {
  navigateTo(devNavigationMenu.Add);
});
