import { webTerminalPO } from '../../pageObjects/web-terminal-po';

export const addTerminals = (n: number) => {
  for (let i = 0; i < n; i++) {
    cy.get(webTerminalPO.addTerminalIcon).click();
  }
};

export const closeTerminal = (x: string) => {
  const n = x.substring(0, 1);
  cy.get(webTerminalPO.closeTerminalIcon)
    .eq(Number(n) - 1)
    .click();
};
