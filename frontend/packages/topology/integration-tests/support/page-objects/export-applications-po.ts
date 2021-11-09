export const exportApplication = {
  exportApplicationButton: '[data-test="export-app-btn"]',
  infoTip: '[aria-label="Info Alert"]',
};

export const buttonDisplayName = (buttonName: string) => {
  switch (buttonName) {
    // below statements to be uncommented after the story ODC-6401 is completed
    //   case 'View logs': {
    //     // to be updated after the story ODC-6401 is completed
    //   }
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
