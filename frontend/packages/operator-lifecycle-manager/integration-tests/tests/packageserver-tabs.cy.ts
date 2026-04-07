import { checkErrors } from '@console/cypress-integration-tests/support';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import * as yamlEditor from '@console/cypress-integration-tests/views/yaml-editor';

describe('packageserver PackageManifest tabs rendering', () => {
  const csvNamespace = 'openshift-operator-lifecycle-manager';
  const csvName = 'packageserver';
  const packageManifestName = '3scale-operator';
  const baseUrl = `/k8s/ns/${csvNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${csvName}/packages.operators.coreos.com~v1~PackageManifest/${packageManifestName}`;
  const sectionHeader = 'PackageManifest overview';

  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  it('renders Details tab correctly', () => {
    cy.log('navigate to PackageManifest Details tab');
    cy.visit(baseUrl);

    cy.log('verify page loads successfully');
    detailsPage.isLoaded();

    cy.log('verify page title shows package name');
    detailsPage.titleShouldContain(packageManifestName);

    cy.log('verify Details section header exists');
    detailsPage.sectionHeaderShouldExist(sectionHeader);
  });

  it('renders YAML tab correctly', () => {
    cy.log('navigate to PackageManifest YAML tab');
    cy.visit(`${baseUrl}/yaml`);

    cy.log('verify YAML editor loads');
    yamlEditor.isLoaded();

    cy.log('verify YAML contains package manifest metadata');
    // eslint-disable-next-line promise/catch-or-return
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include(packageManifestName);
      expect(content).to.include('PackageManifest');
    });
  });

  it('renders Resources tab correctly', () => {
    cy.log('navigate to PackageManifest Resources tab');
    cy.visit(`${baseUrl}/resources`);

    cy.log('verify page loads successfully');
    detailsPage.isLoaded();

    cy.log('verify resource list is empty');
    cy.byTestID('console-empty-state').should('exist');
  });

  it('renders Events tab correctly', () => {
    cy.log('navigate to PackageManifest Events tab');
    cy.visit(`${baseUrl}/events`);

    cy.log('verify page loads successfully');
    detailsPage.isLoaded();

    cy.log('verify events stream component is empty');
    cy.byTestID('console-empty-state').should('exist');
  });

  it('allows navigation between tabs', () => {
    cy.log('start at Details tab');
    cy.visit(baseUrl);
    detailsPage.isLoaded();

    cy.log('navigate to YAML tab');
    detailsPage.selectTab('YAML');
    yamlEditor.isLoaded();
    cy.url().should('include', '/yaml');

    cy.log('navigate to Resources tab');
    detailsPage.selectTab('Resources');
    detailsPage.isLoaded();
    cy.url().should('include', '/resources');
    cy.byTestID('console-empty-state').should('exist');

    cy.log('navigate to Events tab');
    detailsPage.selectTab('Events');
    detailsPage.isLoaded();
    cy.url().should('include', '/events');
    cy.byTestID('console-empty-state').should('exist');

    cy.log('navigate back to Details tab');
    detailsPage.selectTab('Details');
    detailsPage.isLoaded();
    cy.url().should('not.include', '/yaml');
    cy.url().should('not.include', '/resources');
    cy.url().should('not.include', '/events');
    detailsPage.sectionHeaderShouldExist(sectionHeader);
  });
});
