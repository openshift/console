// console tab
export const credentials = '#cloudinit-credentials';
export const credentialsText = '.pf-c-accordion__expanded-content-body';
export const consoleTypeSelector = '#pf-c-console__type-selector';
export const vncConsole = '#VncConsole';
export const serialConsole = '#SerialConsole';
export const vncDisplay =
  'div[style="display: flex; width: 100%; height: 100%; overflow: auto; background: rgb(40, 40, 40);"]';
export const serialDisplay = '.xterm-accessibility';
export const emptyState = '.pf-c-empty-state__body';
export const disconnect = 'Disconnect';
export const connect = 'Connect';
export const sendKey = 'Send Key';
export const ctrlAltDel = 'Ctrl+Alt+Del';

export const loginVNC = () => {
  cy.get(credentials).click();
  cy.get(credentialsText)
    .find('p')
    .then(($output) => {
      const texts = $output.text().split(':');
      const username = texts[1].replace('Password', '').trim();
      const password = texts[2].trim();
      cy.get(consoleTypeSelector).click();
      cy.get(vncConsole).click();
      cy.get(vncDisplay).type(`${username}{enter}`);
      cy.get(consoleTypeSelector).click({ force: true });
      cy.get(vncConsole).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.get(vncDisplay).type(`${password}{enter}`);
    });
};

export const loginSerial = () => {
  cy.get(credentials).click();
  cy.get(credentialsText)
    .find('p')
    .then(($output) => {
      const texts = $output.text().split(':');
      const username = texts[1].replace('Password', '').trim();
      const password = texts[2].trim();
      cy.get(consoleTypeSelector).click();
      cy.get(serialConsole).click();
      cy.get(serialDisplay).type('{enter}');
      cy.get(serialDisplay).type('{enter}'); // send ENTER twice to get login prompt
      cy.get(serialDisplay).type(`${username}{enter}`);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.get(serialDisplay).type(`${password}{enter}`);
    });
};

export const disconnectSerial = () => {
  cy.get(consoleTypeSelector).click();
  cy.get(serialConsole).click();
  cy.get(serialDisplay).type('{enter}');
  cy.byButtonText('Disconnect').click();
};
