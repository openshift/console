import { $, browser, ExpectedConditions as until, by, element } from 'protractor';
import { appHost } from '../protractor.conf';

export const nameInput = $('#inputUsername');
export const passwordInput = $('#inputPassword');
export const submitButton = $('button[type=submit]');
export const logOutButton = element(by.buttonText('Log out'));
export const userDropdown = $('[data-test=user-dropdown] .pf-c-app-launcher__toggle');
export const pf3Login = until.presenceOf($('.login-pf'));
export const pf4Login = until.presenceOf($('[data-test-id="login"]'));

export const selectProvider = async (provider: string) => {
  const idpLink = element(by.cssContainingText('.idp', provider));
  while (!(await idpLink.isPresent())) {
    await browser.get(appHost);
    await browser.sleep(3000);
  }
  await idpLink.click();
};

export const login = async (providerName: string, username: string, password: string) => {
  if (providerName) {
    await selectProvider(providerName);
  }
  console.log('### Waiting for name input ###');
  await browser.wait(until.visibilityOf(nameInput));
  await nameInput.sendKeys(username);
  await passwordInput.sendKeys(password);
  await submitButton.click();
  await browser.wait(until.presenceOf(userDropdown));
};

export const logout = async () => {
  console.log('### Waiting for user dropdown ###');
  await browser.wait(until.presenceOf(userDropdown));
  await userDropdown.click();
  console.log('### Waiting for logout button ###');
  await browser.wait(until.presenceOf(logOutButton));
  await logOutButton.click();
  console.log('### Waiting for login form ###');
  await browser.wait(until.or(pf3Login, pf4Login));
  console.log('### Found login form ###');
};
