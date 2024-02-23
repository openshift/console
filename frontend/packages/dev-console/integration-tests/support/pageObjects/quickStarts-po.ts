export const quickStartsPO = {
  quickStartTitle: '[data-test="page-title"]',
  filterKeyword: 'input.pf-v5-c-search-input__text-input',
  statusFilter: 'button.pf-v5-c-select__toggle',
  statusDropdown: '[aria-label="Select filter"]',
  statusComplete: '[data-key="Complete"]',
  emptyState: 'div.pf-v5-c-empty-state__content',
  clearFilter: '[data-test="clear-filter button"]',
  cardStatus: '[data-test~="tile"] [data-test~="status"]',
  duration: '[data-test="duration"]',
};

export const quickStartSidebarPO = {
  quickStartSidebar: '[data-test~="drawer"]',
  quickStartSidebarBody: '[data-test~="drawer"] [data-test~="content"]',
  startButton: `[data-test="Start button"]`,
  nextButton: '[data-test="Next button"]',
  backButton: '[data-testid="qs-drawer-back"]',
  restartSideNoteAction: '[data-testid="qs-drawer-side-note-action"]',
  closeButton: '[data-test="Close button"]',
  closePanel: '[data-testid="qs-drawer-close"] [aria-label="Close drawer panel"] ',
  yesOptionCheckInput: '[data-testid="qs-drawer-check-yes"]',
  noOptionCheckInput: '[data-testid="qs-drawer-check-no"]',
  clipboardAction: '[aria-label="Copy to clipboard"]',
  executeAction: '[aria-label="Run in Web Terminal"]',
  tooltip: '[role="tooltip"]',
};

export const quickStartLeaveModalPO = {
  leaveModal: '[data-test="leave-quickstart"]',
  leaveButton: '[data-test="leave button"]',
};

export const quickStartDisplayNameToName = (displayName: string) => {
  switch (displayName) {
    case 'Get started with a sample application': {
      return 'sample-application';
    }
    case 'Install the OpenShift Pipelines Operator': {
      return 'explore-pipelines';
    }
    case 'Add health checks to your sample application': {
      return 'add-healthchecks';
    }
    case 'Install the OpenShift Serverless Operator': {
      return 'install-serverless';
    }
    case 'Install Red Hat Developer Hub (RHDH) with a Helm Chart': {
      return 'rhdh-installation-via-helm';
    }
    case 'Create ruby app': {
      return 'copy-execute-demo';
    }
    default: {
      throw new Error('Option is not available');
    }
  }
};

export function quickStartCard(quickStartDisplayName: string) {
  const quickStartName = quickStartDisplayNameToName(quickStartDisplayName);
  return `[data-test~="tile"][data-test~="${quickStartName}"]`;
}
