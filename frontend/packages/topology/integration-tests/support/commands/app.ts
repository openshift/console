import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
import { perspective } from '@console/dev-console/integration-tests/support/pages';

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
});
