import { navigateTo, perspective } from '@console/dev-console/integration-tests/support/pages/app';
import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import { verifyAndInstallKnativeOperator } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';

before(() => {
  verifyAndInstallKnativeOperator();
});

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
  guidedTour.close();
  navigateTo(devNavigationMenu.Add);
});
