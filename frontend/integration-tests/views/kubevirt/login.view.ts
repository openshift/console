import { $, browser, element, by, ExpectedConditions as until } from 'protractor';

export const logOutLink = element(by.linkText('Log out'));
export const userDropdown = $('[data-test=user-dropdown] .pf-c-dropdown__toggle');

export const logout = async() => {
  await browser.wait(until.presenceOf(userDropdown));
  await userDropdown.click();
  await browser.wait(until.presenceOf(logOutLink));
  await logOutLink.click();
};
