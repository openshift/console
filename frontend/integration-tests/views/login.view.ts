import { $, browser, ExpectedConditions as until, by, element } from 'protractor';
import { appHost } from '../protractor.conf';

export const nameInput = $('#inputUsername');
export const passwordInput = $('#inputPassword');
export const submitButton = $('button[type=submit]');
export const logOutLink = element(by.linkText('Log out'));
export const userDropdown = $('[data-test=user-dropdown] .pf-c-app-launcher__toggle');
export const loginPF = $('.login-pf');

export const selectProvider = async(provider: string) => {
  const idpLink = element(by.cssContainingText('.idp', provider));
  while (!(await idpLink.isPresent())) {
    await browser.get(appHost);
    await browser.sleep(3000);
  }
  await idpLink.click();
};

export const login = async(providerName: string, username: string, password: string) => {
  if (await $('a.idp').isPresent()) {
    await selectProvider(providerName);
  }
  await browser.wait(until.visibilityOf(nameInput));
  await nameInput.sendKeys(username);
  await passwordInput.sendKeys(password);
  await submitButton.click();
  await browser.wait(until.presenceOf(userDropdown));
};

export const logout = async() => {
  await browser.wait(until.presenceOf(userDropdown));
  await userDropdown.click();
  await browser.wait(until.presenceOf(logOutLink));
  await logOutLink.click();
  await browser.wait(until.presenceOf(loginPF));
};
