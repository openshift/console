export const exportApplication = {
  exportApplicationButton: '[data-test="export-app-btn"]',
  infoTip: '[aria-label="Info Alert"]',
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
