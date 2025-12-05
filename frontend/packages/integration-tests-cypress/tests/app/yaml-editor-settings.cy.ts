import { checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';
import { guidedTour } from '../../views/guided-tour';
import { listPage } from '../../views/list-page';
import {
  isImportLoaded,
  setEditorContent,
  openEditorSettingsModal,
  closeEditorSettingsModal,
  verifyEditorSettingsModalIsOpen,
  verifyEditorSettingsModalIsClosed,
  selectTheme,
  verifyEditorTheme,
  getFontSizeInput,
  getFontSizeIncreaseButton,
  getFontSizeDecreaseButton,
  setFontSize,
  verifyFontSizeInEditor,
} from '../../views/yaml-editor';

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
    guidedTour.close();
  });

  beforeEach(() => {
    // Wait for YAML editor to load
    isImportLoaded();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.visit('/');
  });

  describe('Settings Modal', () => {
    it('should open the editor settings modal', () => {
      openEditorSettingsModal();
      verifyEditorSettingsModalIsOpen();
      closeEditorSettingsModal();
      verifyEditorSettingsModalIsClosed();
    });
  });

  describe('Theme Setting', () => {
    beforeEach(() => {
      openEditorSettingsModal();
    });

    afterEach(() => {
      closeEditorSettingsModal();
    });

    it('should toggle theme to Dark mode', () => {
      selectTheme('Dark');
      verifyEditorTheme('vs-dark');
    });

    it('should toggle theme to Light mode', () => {
      selectTheme('Light');
      verifyEditorTheme('vs');
    });

    it('should revert to default theme setting', () => {
      selectTheme('Use theme setting');
      verifyEditorTheme(null);
    });
  });

  describe('Font Size Setting', () => {
    beforeEach(() => {
      setEditorContent(YAML_SAMPLE);
      openEditorSettingsModal();
    });

    afterEach(() => {
      closeEditorSettingsModal();
    });

    it('should increase font size', () => {
      getFontSizeInput()
        .invoke('val')
        .then((initialSize) => {
          const currentSize = Number(initialSize);
          // Click twice to increase by 2
          getFontSizeIncreaseButton().click().click();
          getFontSizeInput().should('have.value', (currentSize + 2).toString());
          verifyFontSizeInEditor(currentSize + 2);
        });
    });

    it('should decrease font size', () => {
      getFontSizeInput()
        .invoke('val')
        .then((initialSize) => {
          const currentSize = Number(initialSize);
          getFontSizeDecreaseButton().click();
          getFontSizeInput().should('have.value', (currentSize - 1).toString());
          verifyFontSizeInEditor(currentSize - 1);
        });
    });

    it('should not decrease font size below minimum (5px)', () => {
      setFontSize(5);
      getFontSizeDecreaseButton().should('have.attr', 'disabled');
    });

    it('should allow manual font size input', () => {
      setFontSize(18);
      getFontSizeInput().should('have.value', '18');
      verifyFontSizeInEditor(18);
    });
  });

  describe('Settings Persistence', () => {
    it('should persist settings after modal close and reopen', () => {
      openEditorSettingsModal();

      selectTheme('Dark');
      setFontSize(16);

      closeEditorSettingsModal();
      openEditorSettingsModal();

      // Verify settings persisted
      verifyEditorTheme('vs-dark');
      getFontSizeInput().should('have.value', '16');
      closeEditorSettingsModal();
    });

    it('should persist user settings across pages', () => {
      // Set custom settings on import YAML page
      openEditorSettingsModal();

      selectTheme('Light');
      setFontSize(20);

      closeEditorSettingsModal();

      // Verify settings are applied
      verifyEditorTheme('vs');
      verifyFontSizeInEditor(20);

      // Navigate to a pod YAML page
      cy.visit('/k8s/ns/openshift-console/pods');
      listPage.dvRows.shouldBeLoaded();
      listPage.dvRows.clickFirstLinkInFirstRow();
      detailsPage.selectTab('YAML');
      cy.get('.monaco-editor').should('be.visible');

      // Verify settings persisted across page navigation
      verifyEditorTheme('vs');
      verifyFontSizeInEditor(20);
    });
  });
});
