module.exports = {
  elements: {
    CreateYAMLButton: {
      selector: '#yaml-create'
    },
    actionsDropdownButton: {
      selector: '//span[contains(@class, "btn--actions__label")]',
      locateStrategy: 'xpath'
    },
    actionsDropdownDeleteLink: {
      selector: '//a[starts-with(text(), "Delete ")]',
      locateStrategy: 'xpath'
    },
    deleteModalConfirmButton: {
      selector: '//button[starts-with(text(), "Delete ")]',
      locateStrategy: 'xpath'
    },
    saveYAMLButton: {
      selector: '#save-changes',
    }
  }
};
