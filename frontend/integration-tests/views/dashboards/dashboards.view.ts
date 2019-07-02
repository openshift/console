import { browser, $, $$ } from 'protractor';
import { waitForNone } from '../../protractor.conf';

export const untilNoLoadersPresent = waitForNone($$('.co-m-loader'));
export const isLoaded = () => browser.wait(untilNoLoadersPresent).then(() => browser.sleep(2000));

export const inventoryNodesItemLabel = $('[data-test-id="console-dashboard-inventory-node"]')
  .$('.co-inventory-card__item-title')
  .$('a');
export const inventoryNodesDownCounter = $('[data-test-id="console-dashboard-inventory-node"]').$(
  '[data-test-id="console-dashboard-inventory-count-notready"]',
);

export const inventoryPodsItemLabel = $('[data-test-id="console-dashboard-inventory-pod"]')
  .$('.co-inventory-card__item-title')
  .$('a');
export const inventoryPodsDownCounter = $('[data-test-id="console-dashboard-inventory-pod"]').$(
  '[data-test-id="console-dashboard-inventory-count-crashloopbackoff-failed"]',
);

export const inventoryHostsItemLabel = $(
  '[data-test-id="console-dashboard-inventory-baremetalhost"]',
)
  .$('.co-inventory-card__item-title')
  .$('a');
export const inventoryHostsDownCounter = $(
  '[data-test-id="console-dashboard-inventory-baremetalhost"]',
).$('[data-test-id="console-dashboard-inventory-count-notready"]');

// Utility function: getTextIfPresent
export async function getTextIfPresent(elem, textIfNotPresent = '') {
  if (await elem.isPresent()) {
    return elem.getText();
  }
  return new Promise((resolve) => {
    resolve(textIfNotPresent);
  });
}
