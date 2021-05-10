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
  console.log('  ----> selectProvider: getting idpLink');
  const idpLink = element(by.cssContainingText('.idp', provider));
  console.log('  ----> selectProvider: while !(await idpLink.isPresent())');
  while (!(await idpLink.isPresent())) {
    console.log('    ----> selectProvider: idpLink not Present, get appHost, sleep 10 secs.');
    await browser.get(appHost);
    await browser.sleep(10000);
  }
  console.log('  ----> selectProvider: idpLink.click()');
  await idpLink.click();
};

export const login = async (providerName: string, username: string, password: string) => {
  console.log('----> in login');
  if (providerName) {
    console.log('----> calling selectProvider(providerName)');
    await selectProvider(providerName);
  }
  console.log('----> wait for visibility of username input');
  await browser.wait(until.visibilityOf(nameInput));
  console.log('----> type username');
  await nameInput.sendKeys(username);
  console.log('----> type password');
  await passwordInput.sendKeys(password);
  console.log('----> click submit');
  await submitButton.click();
  console.log('----> wait for userDropdown');
  await browser.wait(until.presenceOf(userDropdown));
};

export const logout = async () => {
  await browser.wait(until.presenceOf(userDropdown));
  await userDropdown.click();
  await browser.wait(until.presenceOf(logOutButton));
  await logOutButton.click();
  await browser.wait(until.or(pf3Login, pf4Login));
};
