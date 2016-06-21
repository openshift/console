'use strict';

const featureFlags = {
  tpm: undefined,
  userManagement: undefined,
};

angular.module('k8s').value('featureFlags', featureFlags);
