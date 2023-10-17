import { checkErrors, testName } from '../../support';
import { oauth } from '../../views/oauth';

describe('OAuth', () => {
  let originalOAuthConfig: any;

  before(() => {
    cy.login();
    cy.exec('oc get oauths cluster -o json').then((result) => {
      originalOAuthConfig = JSON.parse(result.stdout);
    });
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    const idpJSON = JSON.stringify(originalOAuthConfig?.spec?.identityProviders) ?? '[]';
    cy.exec(
      `oc patch oauths cluster --type json -p='[{ op: 'replace', path: '/spec/identityProviders', value: ${idpJSON}}]'`,
    );
  });

  // TODO: Add tests for HTPasswd and Request Header identity providers.
  //       These IDPs require file upload.

  it('creates a Basic Authentication IDP and shows the BasicAuth IDP on the OAuth settings page', () => {
    const idpName = `basic-auth-${testName}`;
    oauth.idpSetup(idpName, 'basicauth');
    cy.get('#url').type('https://example.com');
    oauth.idpSaveAndVerify(idpName, 'BasicAuth');
  });

  it('creates a GitHub IDP and displays it on the OAuth settings page', () => {
    const idpName = `github-${testName}`;
    oauth.idpSetup(idpName, 'github');
    cy.get('#client-id').type('my-client-id');
    cy.get('#client-secret').type('my-client-secret');
    cy.get('[data-test-list-input-for="Organization"]').type('my-organization');
    oauth.idpSaveAndVerify(idpName, 'GitHub');
  });

  it('creates a GitLab IDP and displays on the OAuth settings page', () => {
    const idpName = `gitlab-${testName}`;
    oauth.idpSetup(idpName, 'gitlab');
    cy.get('#url').type('https://example.com');
    cy.get('#client-id').type('my-client-id');
    cy.get('#client-secret').type('my-client-secret');
    oauth.idpSaveAndVerify(idpName, 'GitLab');
  });

  it('creates a Google IDP and displays it on the OAuth settings page', () => {
    const idpName = `google-${testName}`;
    oauth.idpSetup(idpName, 'google');
    cy.get('#client-id').type('my-client-id');
    cy.get('#client-secret').type('my-client-secret');
    cy.get('#hosted-domain').type('example.com');
    oauth.idpSaveAndVerify(idpName, 'Google');
  });

  it('creates a Keystone IDP and displays it on the OAuth settings page', () => {
    const idpName = `keystone-${testName}`;
    oauth.idpSetup(idpName, 'keystone');
    cy.get('#domain-name').type('example.com');
    cy.get('#url').type('https://example.com');
    oauth.idpSaveAndVerify(idpName, 'Keystone');
  });

  it('creates a LDAP IDP and displays it on the OAuth settings page', () => {
    const idpName = `ldap-${testName}`;
    oauth.idpSetup(idpName, 'ldap');
    cy.get('#url').type('ldap://ldap.example.com/o=Acme?cn?sub?(enabled=true)');
    oauth.idpSaveAndVerify(idpName, 'LDAP');
  });

  it('creates a OpenID IDP and displays it on the OAuth settings page', () => {
    const idpName = `oidc-${testName}`;
    oauth.idpSetup(idpName, 'oidconnect');
    cy.get('#client-id').type('my-client-id');
    cy.get('#client-secret').type('my-client-secret');
    cy.get('#issuer').type('https://example.com');
    oauth.idpSaveAndVerify(idpName, 'OpenID');
  });
});
