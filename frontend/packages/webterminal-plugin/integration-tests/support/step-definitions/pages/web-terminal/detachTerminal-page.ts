export const detachTerminalPO = {
  detachButton: 'button:contains("Detach to Cloud Shell")',
  detachedButton: 'button:contains("Detached")',
  detachedTab: '[data-test="detached-terminal-tab"]',
  multiTabTerminal: '[data-test="multi-tab-terminal"]',
  closeTabButton: '[aria-label="Close terminal tab"]',
  cloudShellDrawer: '.co-cloud-shell-drawer',
};

export const detachTerminalPage = {
  clickDetachButton: () => {
    cy.get(detachTerminalPO.detachButton).should('be.visible').click();
  },

  verifyDetachedTabs: (count: number) => {
    cy.get(detachTerminalPO.detachedTab).should('have.length', count);
  },

  verifyNoDetachedTabs: () => {
    cy.get(detachTerminalPO.detachedTab).should('not.exist');
  },

  verifyDetachButtonDisabled: () => {
    cy.get(detachTerminalPO.detachButton).should('be.disabled');
  },

  closeDetachedTab: (index = 0) => {
    cy.get(detachTerminalPO.detachedTab).eq(index).find(detachTerminalPO.closeTabButton).click();
  },

  verifyDrawerOpen: () => {
    cy.get(detachTerminalPO.cloudShellDrawer).should('be.visible');
  },

  verifyDetachedTabWithPodName: (podName: string) => {
    cy.get(detachTerminalPO.detachedTab).contains(podName).should('be.visible');
  },
};
