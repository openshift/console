export const quickStartsPO = {
  quickStartTitle: '[data-test="page-title"]',
  filterKeyword: 'input.pf-c-search-input__text-input',
  statusFilter: 'button.pf-c-select__toggle',
  statusDropdown: '[aria-label="Select filter"]',
  statusComplete: '[data-key="Complete"]',
  emptyState: 'div.pf-c-empty-state__content',
  clearFilter: '[data-test="clear-filter button"]',
  cardStatus: '[data-test~="tile"] [data-test~="status"]',
  duration: '[data-test="duration"]',
};

export const quickStartSidebarPO = {
  quickStartSidebarBody: '[data-test~="drawer"] [data-test~="content"]',
  startButton: `[data-test="Start button"]`,
  nextButton: '[data-test="Next button"]',
  restartSideNoteAction: '[data-testid="qs-drawer-side-note-action"]',
  closeButton: '[data-test="Close button"]',
  closePanel: '[data-test~="drawer"] [aria-label="Close drawer panel"]',
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
    default: {
      throw new Error('Option is not available');
    }
  }
};

export function quickStartCard(quickStartDisplayName: string) {
  const quickStartName = quickStartDisplayNameToName(quickStartDisplayName);
  return `[data-test~="tile"][data-test~="${quickStartName}"]`;
}
