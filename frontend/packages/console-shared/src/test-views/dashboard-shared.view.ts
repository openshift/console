import { browser, ExpectedConditions as until } from 'protractor';
import { untilNoLoadersPresent } from '@console/internal-integration-tests/views/crud.view';

const DASHBOARD_LOAD_WAIT_TIME = 2000;
export const dashboardIsLoaded = () =>
  browser
    .wait(until.and(untilNoLoadersPresent))
    .then(() => browser.sleep(DASHBOARD_LOAD_WAIT_TIME));
