import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { navigateTo, perspective } from '@console/dev-console/integration-tests/support/pages/app';
import {
  devNavigationMenu,
  switchPerspective,
  operators,
} from '@console/dev-console/integration-tests/support/constants/global';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { environmentsPage } from '../../pages/environments-page';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects/operators-po';
import { installOperator } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';
import { operatorsPage } from '@console/dev-console/integration-tests/support/pages/operators-page';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  // Bug: 1890676 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective with guider tour modal');
  guidedTour.close();
  // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective');
});

Given('user is at administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
  guidedTour.close();
});

When('user navigates to Environments page', () => {
  navigateTo(devNavigationMenu.Environments);
});

Then('user will see the message No GitOps manifest URLs found', () => {
  environmentsPage.verifyNoGitOpsUrlsFound();
});

Given('user has installed gitOps operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperator(operators.GitOpsOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.GitOpsOperator);
    } else {
      cy.log('GitOps operator is installed in cluster');
    }
  });
});
