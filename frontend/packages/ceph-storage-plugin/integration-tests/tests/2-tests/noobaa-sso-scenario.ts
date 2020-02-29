import { browser } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/shared/src/test-views/dashboard-shared.view';
import { click } from '@console/shared/src/test-utils/utils';
import {
  noobaaAddStorageResource,
  noobaaAddStorageResourceModal,
  noobaaExternalLink,
  objectServiceLink,
  overviewLink,
} from '../../views/noobaa-sso.view';
import { SECOND } from '../../utils/consts';

describe('Check noobaa link in obejct service dashboard and perform SSO.', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/dashboards`);
    await isLoaded();
  });

  it('Check that noobaa dashboard is opening and links available.', async () => {
    await click(objectServiceLink);
    const parentGUID = await browser.getWindowHandle();
    await click(noobaaExternalLink);
    await browser.sleep(2 * SECOND);
    for (const guid of await browser.getAllWindowHandles()) {
      if (guid !== parentGUID) {
        browser.switchTo().window(guid);
        break;
      }
    }

    await click(noobaaAddStorageResource);
    await browser.sleep(1 * SECOND);
    expect(noobaaAddStorageResourceModal.isPresent()).toBe(true);
    await browser.close();
    await browser.switchTo().window(parentGUID);
    expect(overviewLink.isPresent()).toBe(true);
  });
});
