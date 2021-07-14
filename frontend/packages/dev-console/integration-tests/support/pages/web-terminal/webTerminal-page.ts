import { messages } from '../../constants/webTerminal';
import { webTerminalPO } from '../../pageObjects/webterminal-po';

export const webTerminalPage = {
  clickOpenCloudShellBtn: () => cy.get(webTerminalPO.openComandLine).click(),

  verifyCloudShellBtn: () => cy.get(webTerminalPO.openComandLine).should('be.visible'),

  verifyWebTerminalWindow: () => cy.get(webTerminalPO.terminalWindow).should('be.visible'),

  verifyConnectionRediness: () =>
    cy
      .get(webTerminalPO.terminalWindowWithEnabledMouseEvent, { timeout: 120000 })
      .should('be.visible'),

  verifyOpenInNewTabButton: () => {
    cy.get(webTerminalPO.terminalOpenInNewTabBtn).should('be.visible');
  },

  verifyOpenningInNewTabAttrButton: () => {
    cy.get(webTerminalPO.terminalOpenInNewTabBtn)
      .invoke('attr', 'target')
      .should('equal', '_blank');
  },
  verifyInnactivityMessage: (timeout: number) => {
    cy.get(webTerminalPO.terminalInnactivityMessageArea, { timeout }).should(
      'contain.text',
      messages.inactivityMessage,
    );
  },

  verifyRestartTerminalButton: () => {
    cy.get('button').contains('Restart terminal');
  },

  exitFromCloseTerminalSessionDialod: () => {
    cy.alertTitleShouldContain('Close terminal?');
    cy.byTestID('modal-cancel-action').click();
  },

  closeCurrentTerminalSession: () => {
    cy.byLegacyTestID(webTerminalPO.terminalCloseWindowBtn).click();
    cy.alertTitleShouldContain('Close terminal?');
    cy.byTestID('confirm-action').click();
  },
};
