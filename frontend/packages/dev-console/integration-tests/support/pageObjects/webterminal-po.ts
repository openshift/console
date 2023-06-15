export const webTerminalPO = {
  openCommandLine: 'button[data-tour-id="tour-cloud-shell-button"]',
  terminalWindow: 'canvas.xterm-cursor-layer',
  terminalWindowWithEnabledMouseEvent: 'div.xterm-screen>canvas.xterm-cursor-layer',
  terminalOpenInNewTabBtn: "a[href='/terminal']",
  terminalCloseWindowBtn: "div.ocs-drawer__header button[aria-label='Close terminal']",
  terminalXtermTextArea: "textarea[aria-label='Terminal input']",
  terminalInnactivityMessageArea: 'div.co-cloudshell-exec__error-msg',
  createProjectMenu: {
    createProjectDropdownMenu: 'button#form-ns-dropdown-namespace-field',
    createProjectButton: 'button#\\#CREATE_NAMESPACE_KEY\\#-link',
    selectProjectField: 'input#form-input-newNamespace-field',
  },

  projectNameMenu: {
    projectNameField: 'input#form-input-newNamespace-field',
  },
  closeTerminalDialog: {},
};
