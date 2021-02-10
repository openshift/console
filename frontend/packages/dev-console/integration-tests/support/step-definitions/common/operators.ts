import { Given } from 'cypress-cucumber-preprocessor/steps';
import { guidedTour } from '../../../../../integration-tests-cypress/views/guided-tour';
import { nav } from '../../../../../integration-tests-cypress/views/nav';
import { switchPerspective } from '../../constants/global';
import { perspectiveName } from '../../constants/staticText/global-text';
import { devNavigationMenuPO } from '../../pageObjects/global-po';
import { perspective } from '../../pages/app';

Given('user has installed OpenShift Pipelines operator', () => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(perspectiveName.developer);
  cy.get(devNavigationMenuPO.pageSideBar).then(($navMenu) => {
    if ($navMenu.find(devNavigationMenuPO.pipelines).length) {
      cy.log('pipeline operator is installed');
    }
  });
});
