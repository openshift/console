import { browser, ExpectedConditions as until, $, $$ } from 'protractor';

import { appHost, testName } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as loginView from '../views/login.view';

describe('Basic console test', () => {

  afterAll(async() => {
    // Clears HTTP 401 errors for subsequent tests
    await browser.manage().logs().get('browser');
  });

  it('logs into console if necessary', async() => {
    await browser.get(appHost);

    const {BRIDGE_AUTH_USERNAME, BRIDGE_AUTH_PASSWORD} = process.env;
    if (BRIDGE_AUTH_USERNAME && BRIDGE_AUTH_PASSWORD) {
      await browser.wait(until.visibilityOf(loginView.nameInput), 10000);
      await loginView.nameInput.sendKeys(BRIDGE_AUTH_USERNAME);
      await loginView.passwordInput.sendKeys(BRIDGE_AUTH_PASSWORD);
      await loginView.submitButton.click();
      await browser.wait(until.visibilityOf($('#logo')), 10000);
    }

    expect(browser.getCurrentUrl()).toContain(appHost);
  });

  it('creates test namespace if necessary', async() => {
    await browser.get(`${appHost}/namespaces`);
    await crudView.isLoaded();
    const exists = await crudView.rowForName(testName).isPresent();
    if (!exists) {
      await crudView.createYAMLButton.click();
      await browser.wait(until.presenceOf($('.modal-body__field')));
      await $$('.modal-body__field').get(0).$('input').sendKeys(testName);
      await $('.modal-content').$('#confirm-delete').click();
      await browser.wait(until.urlContains(`/namespaces/${testName}`), 2000);
    }

    expect(browser.getCurrentUrl()).toContain(appHost);
  });
});
