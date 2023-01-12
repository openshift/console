import { checkErrors } from '../../support';
import { warningToast } from '../../views/form';
import { guidedTour } from '../../views/guided-tour';

const CHECK_UPDATES_URL = '/api/check-updates';
const CHECK_UPDATES_ALIAS = 'checkUpdates';
const CHECK_MANIFEST_ALIAS = 'checkManifest';
/* The update wait is the value to wait for the poll of /api/check-updates to return with the updated list of plugins
 after the plugin is enabled and loaded. This wait will be longer on ci than when debugging locally. */
const CHECK_UPDATE_WAIT = 300000;
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
const UPDATES_NEW_PLUGIN = {
  consoleCommit: HASH_DEFAULT,
  plugins: [PLUGIN_NAME],
};
const PLUGIN_MANIFEST_URL = `/api/plugins/${PLUGIN_NAME}/plugin-manifest.json`;
const PLUGIN_MANIFEST_DEFAULT = {
  name: PLUGIN_NAME,
  version: '0.0.0',
};
const PLUGIN_MANIFEST_NEW_VERSION = {
  name: PLUGIN_NAME,
  version: '1.0.0',
};
const WAIT_OPTIONS = { requestTimeout: CHECK_UPDATE_WAIT };

const loadApp = () => {
  cy.visit('/');
  guidedTour.close();
};
const checkConsoleUpdateToast = () => {
  cy.get(warningToast).should('exist');
  cy.byTestID('refresh-web-console').click();
  cy.get(warningToast).should('not.exist');
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
    cy.intercept(PLUGIN_MANIFEST_URL, PLUGIN_MANIFEST_DEFAULT).as(CHECK_MANIFEST_ALIAS);
    cy.wait([`@${CHECK_UPDATES_ALIAS}`, `@${CHECK_MANIFEST_ALIAS}`], WAIT_OPTIONS);
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
