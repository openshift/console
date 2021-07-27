import { checkErrors } from '../../../integration-tests-cypress/support';

describe('Check noobaa link in obejct service dashboard and perform SSO', () => {
  before(() => {
    cy.login();
    cy.install();
    cy.visit('/ocs-dashboards/object');
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('Check that noobaa dashboard is opening and links available.', () => {
    cy.byLegacyTestID('system-name-mcg')
      .invoke('attr', 'href')
      .then((href) => {
        cy.request(href).then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body).toContain('NooBaa Management Console');
        });
      });
  });
});
