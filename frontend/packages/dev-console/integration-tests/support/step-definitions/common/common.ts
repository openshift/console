import { Given } from 'cypress-cucumber-preprocessor/steps';
import { perspective } from '../../pages/app';
import { switchPerspective } from '../../constants/global';
import { guidedTour } from '../../../../../integration-tests-cypress/views/guided-tour';
import { nav } from '../../../../../integration-tests-cypress/views/nav';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  // Bug: 1890676 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective with guider tour modal');
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText('Developer');
  // Bug: 1890678 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective');
});
