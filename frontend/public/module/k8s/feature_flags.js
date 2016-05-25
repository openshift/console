'use strict';

const featureFlags = {
  tpm: undefined
};

angular.module('k8s').value('featureFlags', featureFlags);
