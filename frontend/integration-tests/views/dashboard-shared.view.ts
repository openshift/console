import { browser, ExpectedConditions as until } from 'protractor';
import { untilNoLoadersPresent } from '../views/crud.view';

const extraWaitingLime = 2000;
export const dashboardIsLoaded = () => browser.wait(until.and(untilNoLoadersPresent)).then(() => browser.sleep(extraWaitingLime));
