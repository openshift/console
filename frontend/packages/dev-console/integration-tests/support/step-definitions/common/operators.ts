import { Given } from 'cypress-cucumber-preprocessor/steps';
import { nav } from '../../../../../integration-tests-cypress/views/nav';
import { switchPerspective } from '../../constants/global';
import { adminNavigationMenu, perspectiveName } from '../../constants/staticText/global-text';
import { perspective } from '../../pages/app';
import { operatorsPage } from '../../pages/operators-page';

Given('user has installed OpenShift Serverless Operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(perspectiveName.administrator);
  operatorsPage.verifyOperatorInNavigationMenu(adminNavigationMenu.serverless);
});
