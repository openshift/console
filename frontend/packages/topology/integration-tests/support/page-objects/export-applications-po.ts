export const exportApplication = {
  exportApplicationButton: '[data-test="export-app-btn"]',
  infoTip: '[aria-label="Info Alert"]',
  exportView: '[data-test="export-view-log-btn"]',
  resourceAddedNotification: '[aria-label="Close Info alert: alert: Resource added"]',
};

export const buttonDisplayName = (buttonName: string) => {
  switch (buttonName) {
    case 'View logs': {
      return 'export-view-log-btn';
    }
    case 'Cancel Export': {
      return 'export-cancel-btn';
    }
    case 'Restart Export': {
      return 'export-restart-btn';
    }
    case 'Ok': {
      return 'export-close-btn';
    }
    default: {
      throw new Error('Option is not available');
    }
  }
};

export function exportModalButton(element: string) {
  const buttonName = buttonDisplayName(element);
  return `[data-test~="${buttonName}"]`;
}

export function closeExportNotification() {
  return cy
    .get('[aria-label="Close Info alert: alert: Export application"]')
    .should('be.visible')
    .click();
}
