import { $, element, by, browser, ExpectedConditions as until } from 'protractor';
import { waitForNone } from '@console/internal-integration-tests/protractor.conf';

const dashboard = $('[data-test-id="dashboard"]');

export const loaders = element.all(by.xpath(`//*[contains(@class, 'skeleton-')]`));
export const isLoaded = async () => {
  await browser.wait(until.presenceOf(dashboard));
  await browser.wait(waitForNone(loaders));
};
