export const webTerminalPO = {
  webTerminalIcon: '[data-tour-id="tour-cloud-shell-button"]',
  addTerminalIcon: '[data-test="multi-tab-terminal"] [aria-label="Add new tab"]',
  closeTerminalIcon: '[aria-label="Close terminal tab"]',
  tabsList: '[data-test="multi-tab-terminal"] ul',
  openCommandLine: 'button[data-tour-id="tour-cloud-shell-button"]',
  terminalWindow: 'div.xterm-screen>div.xterm-rows',
  terminalOpenInNewTabBtn: "a[href='/terminal']",
  terminalCloseWindowBtn: "button[aria-label='Close terminal'], [aria-label='Close terminal tab']",
  terminalInnactivityMessageArea: 'div.co-cloudshell-exec__error-msg',
  createProjectMenu: {
    createProjectDropdownMenu: '[data-test-id="namespace-bar-dropdown"] [type="button"]',
    createProjectButton: '[data-test-dropdown-menu="#CREATE_RESOURCE_ACTION#"]',
    selectProjectField: 'input#form-input-newNamespace-field',
    inputField: 'dropdown-text-filter',
  },

  projectNameMenu: {
    projectNameField: '[data-test="input-name"]',
  },
  closeTerminalDialog: {},
};
