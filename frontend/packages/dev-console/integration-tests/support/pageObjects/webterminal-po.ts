export const webTerminalPO = {
  openComandLine: 'button[data-tour-id="tour-cloud-shell-button"]',
  terminalWindow: 'canvas.xterm-cursor-layer',
  terminalWindowWithEnabledMouseEvent: 'div.terminal.xterm.enable-mouse-events',
  terminalOpenInNewTabBtn: "a[href='/terminal']",
  terminalCloseWindowBtn: 'cloudshell-terminal-close',
  terminalInnactivityMessageArea: 'div.co-cloudshell-exec__error-msg',
  createProjectMenu: {
    createProjectDropdownMenu: 'button#form-ns-dropdown-namespace-field',
    createProjectButton: 'button#\\#CREATE_NAMESPACE_KEY\\#-link',
    selectProjectField: 'input[data-test-id="dropdown-text-filter"]',
  },

  projectNameMenu: {
    projectNameField: 'input#form-input-newNamespace-field',
  },
  closeTerminalDialog: {},
};
