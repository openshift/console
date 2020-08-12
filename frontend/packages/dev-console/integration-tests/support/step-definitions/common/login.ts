import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { loginPage } from '../../pages/login_page';

Given('user open the login Page', () => {
  loginPage.visitLoginPage();
});

When('user enter a username {string}', (username: string) => {
  loginPage.fillUsername(username);
});

When('user enter a password {string}', (password: string) => {
  loginPage.fillPassword(password);
});

When('user click the sign-in button', () => {
  loginPage.submitLoginDetails();
});

Then('user should be able to login', () => {
  loginPage.checkLoginSuccess();
});

Then('error should displayed as {string}', (errorMessage: string) => {
  loginPage.checkErrorMessage(errorMessage);
});
