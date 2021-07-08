import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import { navigateTo, perspective } from '@console/dev-console/integration-tests/support/pages';

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Add);
});
