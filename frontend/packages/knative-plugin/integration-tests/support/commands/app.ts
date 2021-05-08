import { navigateTo, perspective } from '@console/dev-console/integration-tests/support/pages/app';
import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import { verifyAndInstallKnativeOperator } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';

before(() => {
  verifyAndInstallKnativeOperator();
});

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Add);
});
