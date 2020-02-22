import { browser, ExpectedConditions as until } from 'protractor';
import { execSync } from 'child_process';

import { appHost, checkLogs, checkErrors, testName } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as oauthView from '../views/oauth.view';

describe('OAuth', () => {
  const oauthSettingsURL = `${appHost}/k8s/cluster/config.openshift.io~v1~OAuth/cluster`;
  let originalOAuthConfig: any;
  beforeAll(() => {
    originalOAuthConfig = JSON.parse(execSync('kubectl get -o json oauths cluster').toString());
  });

  afterAll(() => {
    const idpJSON = JSON.stringify(originalOAuthConfig.spec.identityProviders);
    execSync(
      `kubectl patch oauths cluster --type json -p='[{ op: 'replace', path: '/spec/identityProviders', value: ${idpJSON}}]'`,
    );
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  // TODO: Add tests for HTPasswd and Request Header identity providers.
  //       These IDPs require file upload.

  describe('BasicAuth IDP', () => {
    const idpName = `basic-auth-${testName}`;
    it('creates a Basic Authentication IDP', async () => {
      await browser.get(oauthSettingsURL);
      await browser.wait(until.elementToBeClickable(oauthView.addIDPDropdown));
      await oauthView.addIDPDropdown.click();
      await browser.wait(until.elementToBeClickable(oauthView.basicAuthLink));
      await oauthView.basicAuthLink.click();
      await browser.wait(until.elementToBeClickable(oauthView.idpNameInput));
      await oauthView.idpNameInput.clear();
      await oauthView.idpNameInput.sendKeys(idpName);
      await oauthView.basicAuthURLInput.sendKeys('https://example.com');
      await oauthView.addIDPButton.click();
      expect(oauthView.errorMessage.isPresent()).toBe(false);
    });

    it('shows the BasicAuth IDP on the OAuth settings page', async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain('config.openshift.io~v1~OAuth/cluster');
      await crudView.isLoaded();
      expect(oauthView.idpTableCellName(idpName).getText()).toEqual(idpName);
      expect(oauthView.idpTableCellType(idpName).getText()).toEqual('BasicAuth');
      expect(oauthView.idpTableCellMapping(idpName).getText()).toEqual('claim');
    });
  });

  describe('GitHub IDP', () => {
    const idpName = `github-${testName}`;
    it('creates a GitHub IDP', async () => {
      await browser.get(oauthSettingsURL);
      await browser.wait(until.elementToBeClickable(oauthView.addIDPDropdown));
      await oauthView.addIDPDropdown.click();
      await browser.wait(until.elementToBeClickable(oauthView.githubLink));
      await oauthView.githubLink.click();
      await browser.wait(until.elementToBeClickable(oauthView.idpNameInput));
      await oauthView.idpNameInput.clear();
      await oauthView.idpNameInput.sendKeys(idpName);
      await oauthView.githubClientIDInput.sendKeys('my-client-id');
      await oauthView.githubClientSecretInput.sendKeys('my-client-secret');
      await oauthView.githubOrganizationInput.sendKeys('my-organization');
      await oauthView.addIDPButton.click();
      expect(oauthView.errorMessage.isPresent()).toBe(false);
    });

    it('shows the GitHub IDP on the OAuth settings page', async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain('config.openshift.io~v1~OAuth/cluster');
      await crudView.isLoaded();
      expect(oauthView.idpTableCellName(idpName).getText()).toEqual(idpName);
      expect(oauthView.idpTableCellType(idpName).getText()).toEqual('GitHub');
      expect(oauthView.idpTableCellMapping(idpName).getText()).toEqual('claim');
    });
  });

  describe('GitLab IDP', () => {
    const idpName = `gitlab-${testName}`;
    it('creates a GitLab IDP', async () => {
      await browser.get(oauthSettingsURL);
      await browser.wait(until.elementToBeClickable(oauthView.addIDPDropdown));
      await oauthView.addIDPDropdown.click();
      await browser.wait(until.elementToBeClickable(oauthView.gitlabLink));
      await oauthView.gitlabLink.click();
      await browser.wait(until.elementToBeClickable(oauthView.idpNameInput));
      await oauthView.idpNameInput.clear();
      await oauthView.idpNameInput.sendKeys(idpName);
      await oauthView.gitlabURLInput.sendKeys('https://example.com');
      await oauthView.gitlabClientIDInput.sendKeys('my-client-id');
      await oauthView.gitlabClientSecretInput.sendKeys('my-client-secret');
      await oauthView.addIDPButton.click();
      expect(oauthView.errorMessage.isPresent()).toBe(false);
    });

    it('shows the GitLab IDP on the OAuth settings page', async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain('config.openshift.io~v1~OAuth/cluster');
      await crudView.isLoaded();
      expect(oauthView.idpTableCellName(idpName).getText()).toEqual(idpName);
      expect(oauthView.idpTableCellType(idpName).getText()).toEqual('GitLab');
      expect(oauthView.idpTableCellMapping(idpName).getText()).toEqual('claim');
    });
  });

  describe('Google IDP', () => {
    const idpName = `google-${testName}`;
    it('creates a Google IDP', async () => {
      await browser.get(oauthSettingsURL);
      await browser.wait(until.elementToBeClickable(oauthView.addIDPDropdown));
      await oauthView.addIDPDropdown.click();
      await browser.wait(until.elementToBeClickable(oauthView.googleLink));
      await oauthView.googleLink.click();
      await browser.wait(until.elementToBeClickable(oauthView.idpNameInput));
      await oauthView.idpNameInput.clear();
      await oauthView.idpNameInput.sendKeys(idpName);
      await oauthView.googleClientIDInput.sendKeys('my-client-id');
      await oauthView.googleClientSecretInput.sendKeys('my-client-secret');
      await oauthView.googleHostedDomainInput.sendKeys('example.com');
      await oauthView.addIDPButton.click();
      expect(oauthView.errorMessage.isPresent()).toBe(false);
    });

    it('shows the Google IDP on the OAuth settings page', async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain('config.openshift.io~v1~OAuth/cluster');
      await crudView.isLoaded();
      expect(oauthView.idpTableCellName(idpName).getText()).toEqual(idpName);
      expect(oauthView.idpTableCellType(idpName).getText()).toEqual('Google');
      expect(oauthView.idpTableCellMapping(idpName).getText()).toEqual('claim');
    });
  });

  describe('Keystone IDP', () => {
    const idpName = `keystone-${testName}`;
    it('creates a Keystone IDP', async () => {
      await browser.get(oauthSettingsURL);
      await browser.wait(until.elementToBeClickable(oauthView.addIDPDropdown));
      await oauthView.addIDPDropdown.click();
      await browser.wait(until.elementToBeClickable(oauthView.keystoneLink));
      await oauthView.keystoneLink.click();
      await browser.wait(until.elementToBeClickable(oauthView.idpNameInput));
      await oauthView.idpNameInput.clear();
      await oauthView.idpNameInput.sendKeys(idpName);
      await oauthView.keystoneDomainInput.sendKeys('example.com');
      await oauthView.keystoneURLInput.sendKeys('https://example.com');
      await oauthView.addIDPButton.click();
      expect(oauthView.errorMessage.isPresent()).toBe(false);
    });

    it('shows the Keystone IDP on the OAuth settings page', async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain('config.openshift.io~v1~OAuth/cluster');
      await crudView.isLoaded();
      expect(oauthView.idpTableCellName(idpName).getText()).toEqual(idpName);
      expect(oauthView.idpTableCellType(idpName).getText()).toEqual('Keystone');
      expect(oauthView.idpTableCellMapping(idpName).getText()).toEqual('claim');
    });
  });

  describe('LDAP IDP', () => {
    const idpName = `ldap-${testName}`;
    it('creates a LDAP IDP', async () => {
      await browser.get(oauthSettingsURL);
      await browser.wait(until.elementToBeClickable(oauthView.addIDPDropdown));
      await oauthView.addIDPDropdown.click();
      await browser.wait(until.elementToBeClickable(oauthView.ldapLink));
      await oauthView.ldapLink.click();
      await browser.wait(until.elementToBeClickable(oauthView.idpNameInput));
      await oauthView.idpNameInput.clear();
      await oauthView.idpNameInput.sendKeys(idpName);
      await oauthView.ldapURLInput.sendKeys('ldap://ldap.example.com/o=Acme?cn?sub?(enabled=true)');
      await oauthView.addIDPButton.click();
      expect(oauthView.errorMessage.isPresent()).toBe(false);
    });

    it('shows the LDAP IDP on the OAuth settings page', async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain('config.openshift.io~v1~OAuth/cluster');
      await crudView.isLoaded();
      expect(oauthView.idpTableCellName(idpName).getText()).toEqual(idpName);
      expect(oauthView.idpTableCellType(idpName).getText()).toEqual('LDAP');
      expect(oauthView.idpTableCellMapping(idpName).getText()).toEqual('claim');
    });
  });

  describe('OpenID IDP', () => {
    const idpName = `oidc-${testName}`;
    it('creates a OpenID IDP', async () => {
      await browser.get(oauthSettingsURL);
      await browser.wait(until.elementToBeClickable(oauthView.addIDPDropdown));
      await oauthView.addIDPDropdown.click();
      await browser.wait(until.elementToBeClickable(oauthView.oidcLink));
      await oauthView.oidcLink.click();
      await browser.wait(until.elementToBeClickable(oauthView.idpNameInput));
      await oauthView.idpNameInput.clear();
      await oauthView.idpNameInput.sendKeys(idpName);
      await oauthView.oidcClientIDInput.sendKeys('my-client-id');
      await oauthView.oidcClientSecretInput.sendKeys('my-client-secret');
      await oauthView.oidcIssuerInput.sendKeys('https://example.com');
      await oauthView.addIDPButton.click();
      expect(oauthView.errorMessage.isPresent()).toBe(false);
    });

    it('shows the OpenID IDP on the OAuth settings page', async () => {
      await browser.wait(until.presenceOf(crudView.resourceTitle));
      expect(browser.getCurrentUrl()).toContain('config.openshift.io~v1~OAuth/cluster');
      await crudView.isLoaded();
      expect(oauthView.idpTableCellName(idpName).getText()).toEqual(idpName);
      expect(oauthView.idpTableCellType(idpName).getText()).toEqual('OpenID');
      expect(oauthView.idpTableCellMapping(idpName).getText()).toEqual('claim');
    });
  });
});
