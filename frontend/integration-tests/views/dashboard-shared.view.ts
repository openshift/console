import { browser, by, ExpectedConditions as until } from 'protractor';
import { untilNoLoadersPresent } from '../views/crud.view';

export const dashboardIsLoaded = () => browser.wait(until.and(untilNoLoadersPresent)).then(() => browser.sleep(1000));
