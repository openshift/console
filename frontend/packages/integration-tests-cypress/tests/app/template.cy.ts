import { catalog } from '../../views/catalogs';

describe('template feature', () => {
  before(() => {
    cy.log('create template:');
    cy.exec(`oc create -f ./fixtures/httpd-example-template.yaml -n openshift`).then((result) => {
      expect(result.stdout).to.include('created');
    });
    cy.login();
  });

  after(() => {
    cy.exec('oc delete template httpd-example-test -n openshift');
  });
  it('Allow custom icon using template annotation', () => {
    cy.clickNavLink(['Ecosystem', 'Software Catalog']);
    cy.get('.loading-box__loaded', { timeout: 50000 }).should('exist');
    catalog.filterByKeyword('test apach');
    cy.byTestID('Template-Test Apache HTTP Server').click();
    cy.exec(
      `oc get template httpd-example-test -n openshift -o jsonpath='{.metadata.annotations.iconClass}'`,
    ).then((output) => {
      const iconClass = output.stdout;
      cy.log(`1. icon url: ${iconClass}`);
      catalog.checkItemImage(`${iconClass}`);
    });
  });
});
