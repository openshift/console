export const webTerminalPO = {
  openCommandLine: 'button[data-tour-id="tour-cloud-shell-button"]',
  terminalWindow: 'canvas.xterm-cursor-layer',
  terminalWindowWithEnabledMouseEvent: 'div.xterm-screen>canvas.xterm-cursor-layer',
  terminalOpenInNewTabBtn: "a[href='/terminal']",
  terminalCloseWindowBtn: "button[data-test='close-terminal-icon']",
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
