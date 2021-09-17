// bootOrder
export const bootOrder = '.kv-vm-resource--boot-order';
export const addSource = '#add-device-btm';
export const selectDevice = 'select[id="add-device-select"]';
export const draggablePointer = 'div[style="cursor: move;"]';
export const deletePointer = 'div[style="cursor: pointer;"]';

// Scheduling and resources requirements
export const nodeSelector = '[data-test-id="details-Node Selector"]';
export const tolerations = '[data-test-id="details-Tolerations"]';
export const affinityRules = '[data-test-id="details-Affinity Rules"]';
export const addBtn = '#vm-labels-list-add-btn';
export const keyInput = (type: string) => `#${type}-0-key-input`;
export const valueInput = (type: string) => `#${type}-0-value-input`;
export const deleteBtn = (type: string) => `#${type}-0-delete-btn`;
export const editBtnIcon = '.co-icon-space-l.pf-c-button-icon--plain';
export const affinityRuleValueInput = '.pf-c-select__toggle-typeahead';
export const flavor = '[data-test-id="details-Flavor"]';
export const flavorSelect = '#vm-flavor-modal-flavor';
export const customCPU = '#vm-flavor-modal-cpu';
export const customMem = '#vm-flavor-modal-memory-size';
export const dedicatedResources = '[data-test-id="details-Dedicated Resources"]';
export const dedicatedResourcesCheckbox = '#dedicated-resources-checkbox';
export const evictionStrategy = '[data-test-id="details-Eviction Strategy"]';
export const liveMigrateCheckbox = '#eviction-strategy';
