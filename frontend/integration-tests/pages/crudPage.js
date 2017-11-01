module.exports = {
  elements: {
    CreateYAMLButton: {
      selector: '#yaml-create',
      locateStrategy: 'css selector',
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
      selector: '#confirm-delete',
      locateStrategy: 'css selector',
    },
    saveYAMLButton: {
      selector: '#save-changes',
      locateStrategy: 'css selector',
    }
  }
};
