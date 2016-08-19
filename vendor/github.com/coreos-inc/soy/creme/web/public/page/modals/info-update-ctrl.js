angular.module('creme.page')
.controller('InfoUpdateModalCtrl', InfoUpdateModalCtrl);

function InfoUpdateModalCtrl($q, $modalInstance, model, defaultErrorMessage, submitFn) {
  'use strict';
  this.model = angular.copy(model);
  this.errorMessage = null;
  this.defaultErrorMessage = defaultErrorMessage;
  this.submitFn = submitFn;

  this.submit = function(form) {
    var that = this;
    if (form.$invalid) {
      return;
    }

    this.errorMessage = null;
    this.submitPromise = this.submitFn(this.model);
    this.submitPromise
    .then(function(result) {
      that.errorMessage = null;
      that.model = result;
      $modalInstance.close(result);
    })
    .catch(function(e) {
      if (e.data && e.data.description) {
        that.errorMessage = e.data.description;
      } else {
        that.errorMessage = that.defaultErrorMessage;
      }
      return $q.reject(that.errorMessage);
    });
  };

}
