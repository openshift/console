import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { switchPerspective } from '@console/dev-console/integration-tests/support/constants/global';
import { perspective } from '@console/dev-console/integration-tests/support/pages/app';

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
});
