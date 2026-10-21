import { checkErrors, testName } from '../../support';
import * as yamlEditor from '../../views/yaml-editor';

describe('Bulk import operation', () => {
  const namespace = `bulk${testName}`;
  const dupSecrets = `apiVersion: v1
kind: Secret
metadata:
  name: secret-dup
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame
---
apiVersion: v1
kind: Secret
metadata:
  name: secret-dup
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame`;
  const missingNS = `apiVersion: v1
kind: Secret
metadata:
  name: example1
  namespace: missingns
type: Opaque
stringData:
  username: admin1
  password: opensesame
---
apiVersion: v1
kind: Secret
metadata:
  name: example2
  namespace: missingns
type: Opaque
stringData:
  username: admin2
  password: opensesame`;
  const threeSecrets = `apiVersion: v1
kind: Secret
metadata:
  name: secret-one
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame
---
apiVersion: v1
kind: Secret
metadata:
  name: secret-two
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame
---
apiVersion: v1
kind: Secret
metadata:
  name: secret-three
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame`;

  before(() => {
    cy.login();
    cy.createProjectWithCLI(namespace);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(namespace);
  });

  it('fail to import duplicate yaml definitions (local validation)', () => {
    cy.visit(`/k8s/ns/${namespace}/import`);
    yamlEditor.isImportLoaded();
    yamlEditor.setEditorContent(dupSecrets).then(() => {
      yamlEditor.clickSaveCreateButton();
      cy.byTestID('yaml-error').should('exist');
    });
  });

  it('fail to import missing namespaced resources (server validation)', () => {
    cy.visit(`/k8s/ns/${namespace}/import`);
    yamlEditor.isImportLoaded();
    yamlEditor.setEditorContent(missingNS).then(() => {
      yamlEditor.clickSaveCreateButton();
      cy.byTestID('retry-failed-resources').should('exist');
    });
  });

  it('successfully import three yaml secret definitions', () => {
    cy.visit(`/k8s/ns/${namespace}/import`);
    yamlEditor.isImportLoaded();
    yamlEditor.setEditorContent(threeSecrets).then(() => {
      yamlEditor.clickSaveCreateButton();
      cy.byTestID('yaml-error').should('not.exist');
      cy.byLegacyTestID('secret-one').should('exist');
      cy.byLegacyTestID('secret-two').should('exist');
      cy.byLegacyTestID('secret-three').should('exist');
      cy.byLegacyTestID(`${namespace}`).should('have.length', 3);
      cy.byTestID('success-icon').should('have.length', 4);
      cy.byTestID('import-more-yaml').should('exist');
      cy.byTestID('import-more-yaml').click();
      yamlEditor.isImportLoaded();
    });
  });
});
