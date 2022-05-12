import { webTerminalPO } from '../../pageObjects/web-terminal-po';

export const checkTerminalIcon = (tries: number = 10) => {
  if (tries < 1) {
    return;
  }
  cy.get('body').then(($body) => {
    if ($body.find(webTerminalPO.webTerminalIcon).length === 0) {
      cy.reload();
      cy.wait(10000); // wait is for body to render after reload
      checkTerminalIcon(tries - 1);
    } else {
      cy.log('Found');
    }
  });
};
