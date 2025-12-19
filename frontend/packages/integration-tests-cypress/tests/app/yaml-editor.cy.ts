import { checkErrors } from '../../support';
import * as common from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import * as yamlEditor from '../../views/yaml-editor';

const YAML_SAMPLE = `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
  namespace: default
data:
  key: value`;

describe('YAML Editor Settings', () => {
  before(() => {
    cy.login();
    cy.visit('/k8s/ns/default/import');
  });

  beforeEach(() => {
    // Wait for YAML editor to load
    yamlEditor.isImportLoaded();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.visit('/');
  });

  describe('Settings Modal', () => {
    it('should open the editor settings modal', () => {
      yamlEditor.openEditorSettingsModal();
      yamlEditor.verifyEditorSettingsModalIsOpen();
      yamlEditor.closeEditorSettingsModal();
      yamlEditor.verifyEditorSettingsModalIsClosed();
    });
  });

  describe('Theme Setting', () => {
    beforeEach(() => {
      yamlEditor.openEditorSettingsModal();
    });

    afterEach(() => {
      yamlEditor.closeEditorSettingsModal();
    });

    it('should toggle theme to Dark mode', () => {
      yamlEditor.selectTheme('Dark');
      yamlEditor.verifyEditorTheme('vs-dark');
    });

    it('should toggle theme to Light mode', () => {
      yamlEditor.selectTheme('Light');
      yamlEditor.verifyEditorTheme('vs');
    });

    it('should revert to default theme setting', () => {
      yamlEditor.selectTheme('Use theme setting');
      yamlEditor.verifyEditorTheme(null);
    });
  });

  describe('Font Size Setting', () => {
    beforeEach(() => {
      yamlEditor.setEditorContent(YAML_SAMPLE);
      yamlEditor.openEditorSettingsModal();
    });

    afterEach(() => {
      yamlEditor.closeEditorSettingsModal();
    });

    it('should increase font size', () => {
      yamlEditor
        .getFontSizeInput()
        .invoke('val')
        .then((initialSize) => {
          const currentSize = Number(initialSize);
          // Click twice to increase by 2
          yamlEditor.getFontSizeIncreaseButton().click().click();
          yamlEditor.getFontSizeInput().should('have.value', (currentSize + 2).toString());
          yamlEditor.verifyFontSizeInEditor(currentSize + 2);
        });
    });

    it('should decrease font size', () => {
      yamlEditor
        .getFontSizeInput()
        .invoke('val')
        .then((initialSize) => {
          const currentSize = Number(initialSize);
          yamlEditor.getFontSizeDecreaseButton().click();
          yamlEditor.getFontSizeInput().should('have.value', (currentSize - 1).toString());
          yamlEditor.verifyFontSizeInEditor(currentSize - 1);
        });
    });

    it('should not decrease font size below minimum (5px)', () => {
      yamlEditor.setFontSize(5);
      yamlEditor.getFontSizeDecreaseButton().should('have.attr', 'disabled');
    });

    it('should allow manual font size input', () => {
      yamlEditor.setFontSize(18);
      yamlEditor.getFontSizeInput().should('have.value', '18');
      yamlEditor.verifyFontSizeInEditor(18);
    });
  });

  describe('Settings Persistence', () => {
    it('should persist settings after modal close and reopen', () => {
      yamlEditor.openEditorSettingsModal();

      yamlEditor.selectTheme('Dark');
      yamlEditor.setFontSize(16);

      yamlEditor.closeEditorSettingsModal();
      yamlEditor.openEditorSettingsModal();

      // Verify settings persisted
      yamlEditor.verifyEditorTheme('vs-dark');
      yamlEditor.getFontSizeInput().should('have.value', '16');
      yamlEditor.closeEditorSettingsModal();
    });

    it('should persist user settings across pages', () => {
      // Set custom settings on import YAML page
      yamlEditor.openEditorSettingsModal();

      yamlEditor.selectTheme('Light');
      yamlEditor.setFontSize(20);

      yamlEditor.closeEditorSettingsModal();

      // Verify settings are applied
      yamlEditor.verifyEditorTheme('vs');
      yamlEditor.verifyFontSizeInEditor(20);

      // Navigate to a pod YAML page
      cy.visit('/k8s/ns/openshift-console/pods');
      listPage.dvRows.shouldBeLoaded();
      listPage.dvRows.clickFirstLinkInFirstRow();
      detailsPage.selectTab('YAML');
      cy.get('.monaco-editor').should('be.visible');

      // Verify settings persisted across page navigation
      yamlEditor.verifyEditorTheme('vs');
      yamlEditor.verifyFontSizeInEditor(20);
    });
  });
});

describe('Yaml editor sidebar', () => {
  before(() => {
    cy.login();
  });
  it('Show possible enum values in yaml sidebar', () => {
    cy.clickNavLink(['Workloads', 'Deployments']);
    common.projectDropdown.selectProject('openshift-console');
    common.projectDropdown.shouldContain('openshift-console');
    cy.get('#content-scrollable', { timeout: 30000 }).should('exist');
    listPage.dvRows.shouldBeLoaded();
    listPage.dvRows.clickRowByName('downloads');
    detailsPage.isLoaded();
    detailsPage.selectTab('YAML');
    cy.get('button[aria-label="Show sidebar"]', { timeout: 30000 }).should('exist');
    yamlEditor.showYAMLSidebar();
    cy.contains('button', 'Schema').should('exist');
    yamlEditor.clickFieldDetailsButton('spec');
    yamlEditor.clickFieldDetailsButton('strategy');
    cy.contains('p', 'Allowed values:').should('exist');
    cy.contains('p', 'Recreate, RollingUpdate').should('exist');
  });
});
