export const userPreferencePO = {
  userMenu: '[data-test="user-dropdown"]',
  userPreference: 'button.pf-c-select__toggle',
  namespaceTypeahead: '[id="console.preferredNamespace-select-typeahead"]',
  languageTab: '[data-test="tab language"]',
  creteProjectButton: '[data-test="footer create-namespace-button"]',
  checkboxPreferredLanguage: '[data-test="checkbox console.preferredLanguage"]',
};

export const preferenceDropdownDisplayNameToName = (displayName: string) => {
  switch (displayName) {
    case 'Perspective': {
      return 'Perspective';
    }
    case 'Project': {
      return 'Namespace';
    }
    case 'Topology': {
      return 'View';
    }
    case 'Create/Edit resource method': {
      return 'CreateEditMethod';
    }
    case 'Language': {
      return 'Language';
    }
    default: {
      throw new Error('Preference is not available');
    }
  }
};

export function getTab(tabName: string) {
  return `[data-test~="tab"][data-test~="${tabName.toLowerCase()}"]`;
}

export function getPreferenceDropdown(preference: string) {
  const preferenceName = preferenceDropdownDisplayNameToName(preference);
  if (preference === 'Topology') {
    return `[id="topology.preferred${preferenceName}"]`;
  }
  return `[id="console.preferred${preferenceName}"]`;
}
