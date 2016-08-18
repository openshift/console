angular.module('creme.page').controller('AccountSelectorModalCtrl', AccountSelectorModalCtrl);

function AccountSelectorModalCtrl($modalInstance, _, accounts, defaultAccount) {
  'use strict';
  var selectedAccount = defaultAccount || null;
  this.accounts = accounts;
  this.selectedID = selectedAccount ? selectedAccount.id : 'new';

  this.selectAccount = function(id) {
    this.selectedID = id;
  };

  this.submit = function() {
    if (this.selectedID === 'new') {
      selectedAccount = null;
    } else {
      selectedAccount = _.findWhere(this.accounts, { id: this.selectedID });
    }
    $modalInstance.close(selectedAccount);
  };

}
