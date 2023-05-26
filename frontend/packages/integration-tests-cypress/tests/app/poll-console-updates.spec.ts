import { checkErrors } from '../../support';
import { refreshWebConsoleLink } from '../../views/form';
import { guidedTour } from '../../views/guided-tour';

const CHECK_UPDATES_URL = '/api/check-updates';
const CHECK_UPDATES_ALIAS = 'checkUpdates';
const CHECK_MANIFEST_ALIAS = 'checkManifest';
const CHECK_MANIFEST_ALIAS2 = 'checkManifest2';
const PLUGINS_DEFAULT = [];
const HASH_DEFAULT = 'hash';
const UPDATES_DEFAULT = {
  consoleCommit: HASH_DEFAULT,
  plugins: PLUGINS_DEFAULT,
};
const UPDATES_NEW_COMMIT = {
  consoleCommit: 'newhash',
  plugins: PLUGINS_DEFAULT,
};
const PLUGIN_NAME = 'console-demo-plugin';
const PLUGIN_NAME2 = 'console-demo-plugin2';
const UPDATES_NEW_PLUGIN = {
  consoleCommit: HASH_DEFAULT,
  plugins: [PLUGIN_NAME],
};
const UPDATES_NEW_PLUGIN2 = {
  consoleCommit: HASH_DEFAULT,
  plugins: [PLUGIN_NAME, PLUGIN_NAME2],
};
const PLUGIN_MANIFEST_URL = `/api/plugins/${PLUGIN_NAME}/plugin-manifest.json`;
const PLUGIN_MANIFEST_URL2 = `/api/plugins/${PLUGIN_NAME2}/plugin-manifest.json`;
const PLUGIN_MANIFEST_DEFAULT = {
  name: PLUGIN_NAME,
  version: '0.0.0',
};
const PLUGIN_MANIFEST_DEFAULT2 = {
  name: PLUGIN_NAME2,
  version: '0.0.0',
};
const PLUGIN_MANIFEST_NEW_VERSION = {
  name: PLUGIN_NAME,
  version: '1.0.0',
};
const WAIT_OPTIONS = { requestTimeout: 300000 };

const loadApp = () => {
  cy.visit('/');
  guidedTour.close();
};
const checkConsoleUpdateToast = () => {
  cy.byTestID(refreshWebConsoleLink).should('exist').click();
  cy.get(refreshWebConsoleLink).should('not.exist');
  cy.byTestID('loading-indicator').should('not.exist');
};

describe('PollConsoleUpdates Test', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('triggers the console update toast when consoleCommit changes', () => {
    loadApp();
    cy.intercept(CHECK_UPDATES_URL, UPDATES_DEFAULT).as(CHECK_UPDATES_ALIAS);
    cy.wait(`@${CHECK_UPDATES_ALIAS}`, WAIT_OPTIONS);
    cy.intercept(CHECK_UPDATES_URL, UPDATES_NEW_COMMIT).as(CHECK_UPDATES_ALIAS);
    cy.wait(`@${CHECK_UPDATES_ALIAS}`, WAIT_OPTIONS);
    checkConsoleUpdateToast();
  });

  it('triggers the console update toast when a plugin is added', () => {
    loadApp();
    cy.intercept(CHECK_UPDATES_URL, UPDATES_DEFAULT).as(CHECK_UPDATES_ALIAS);
    cy.wait(`@${CHECK_UPDATES_ALIAS}`, WAIT_OPTIONS);
    cy.intercept(CHECK_UPDATES_URL, UPDATES_NEW_PLUGIN).as(CHECK_UPDATES_ALIAS);
    cy.intercept(PLUGIN_MANIFEST_URL, { forceNetworkError: true }).as(CHECK_MANIFEST_ALIAS);
    cy.wait(`@${CHECK_UPDATES_ALIAS}`, WAIT_OPTIONS);
    cy.wait(`@${CHECK_MANIFEST_ALIAS}`, WAIT_OPTIONS).should('have.property', 'error');
    cy.get(refreshWebConsoleLink).should('not.exist');
    cy.intercept(PLUGIN_MANIFEST_URL, PLUGIN_MANIFEST_DEFAULT).as(CHECK_MANIFEST_ALIAS);
    cy.wait(`@${CHECK_MANIFEST_ALIAS}`, WAIT_OPTIONS);
    checkConsoleUpdateToast();
  });

  it('triggers the console update toast when a plugin is added and a different plugin endpoint is erroring', () => {
    loadApp();
    cy.intercept(CHECK_UPDATES_URL, UPDATES_NEW_PLUGIN).as(CHECK_UPDATES_ALIAS);
    cy.intercept(PLUGIN_MANIFEST_URL, { forceNetworkError: true }).as(CHECK_MANIFEST_ALIAS);
    cy.wait(`@${CHECK_UPDATES_ALIAS}`, WAIT_OPTIONS);
    cy.wait(`@${CHECK_MANIFEST_ALIAS}`, WAIT_OPTIONS).should('have.property', 'error');
    cy.byTestID('loading-indicator').should('not.exist');
    cy.get(refreshWebConsoleLink).should('not.exist');
    cy.intercept(CHECK_UPDATES_URL, UPDATES_NEW_PLUGIN2).as(CHECK_UPDATES_ALIAS);
    cy.wait(`@${CHECK_UPDATES_ALIAS}`, WAIT_OPTIONS);
    cy.intercept(PLUGIN_MANIFEST_URL2, { forceNetworkError: true }).as(CHECK_MANIFEST_ALIAS2);
    cy.wait(`@${CHECK_MANIFEST_ALIAS2}`, WAIT_OPTIONS);
    cy.byTestID('loading-indicator').should('not.exist');
    cy.get(refreshWebConsoleLink).should('not.exist');
    cy.intercept(PLUGIN_MANIFEST_URL2, PLUGIN_MANIFEST_DEFAULT2).as(CHECK_MANIFEST_ALIAS2);
    cy.wait(`@${CHECK_MANIFEST_ALIAS2}`, WAIT_OPTIONS);
    checkConsoleUpdateToast();
  });

  it('triggers the console update toast when a plugin is removed', () => {
    loadApp();
    cy.intercept(CHECK_UPDATES_URL, UPDATES_NEW_PLUGIN).as(CHECK_UPDATES_ALIAS);
    cy.intercept(PLUGIN_MANIFEST_URL, PLUGIN_MANIFEST_DEFAULT).as(CHECK_MANIFEST_ALIAS);
    cy.wait([`@${CHECK_UPDATES_ALIAS}`, `@${CHECK_MANIFEST_ALIAS}`], WAIT_OPTIONS);
    cy.intercept(CHECK_UPDATES_URL, UPDATES_DEFAULT).as(CHECK_UPDATES_ALIAS);
    cy.wait(`@${CHECK_UPDATES_ALIAS}`, WAIT_OPTIONS);
    checkConsoleUpdateToast();
  });

  it('triggers the console update toast when a plugin version changes', () => {
    loadApp();
    cy.intercept(CHECK_UPDATES_URL, UPDATES_NEW_PLUGIN).as(CHECK_UPDATES_ALIAS);
    cy.intercept(PLUGIN_MANIFEST_URL, PLUGIN_MANIFEST_DEFAULT).as(CHECK_MANIFEST_ALIAS);
    cy.wait([`@${CHECK_UPDATES_ALIAS}`, `@${CHECK_MANIFEST_ALIAS}`], WAIT_OPTIONS);
    cy.intercept(PLUGIN_MANIFEST_URL, PLUGIN_MANIFEST_NEW_VERSION).as(CHECK_MANIFEST_ALIAS);
    cy.wait(`@${CHECK_MANIFEST_ALIAS}`, WAIT_OPTIONS);
    checkConsoleUpdateToast();
  });
});
