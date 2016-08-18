angular.module('creme.page').controller('CancelSubscriptionModalCtrl', CancelSubscriptionModalCtrl);

function CancelSubscriptionModalCtrl($scope, $injector, $modalInstance, model, defaultErrorMessage, submitFn) {
  'use strict';
  if (!_.isEmpty(model.currentPeriodEnd)) {
    this.endDate = model.currentPeriodEnd;
  } else if (!_.isEmpty(model.trialEnd)) {
    this.endDate = model.trialEnd;
  }

  $injector.invoke(InfoUpdateModalCtrl, this, {
    $scope: $scope,
    model: model,
    defaultErrorMessage: defaultErrorMessage,
    submitFn: submitFn,
    $modalInstance: $modalInstance,
  });
}
