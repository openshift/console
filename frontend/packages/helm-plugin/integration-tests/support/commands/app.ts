import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { nav } from '@console/cypress-integration-tests/views/nav';
import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import { navigateTo, perspective } from '@console/dev-console/integration-tests/support/pages/app';

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Add);
});
