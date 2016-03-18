angular.module('bridge.service')
.factory('featuresSvc', function($window) {
  'use strict';
  return {
    isAuthDisabled: $window.SERVER_FLAGS.authDisabled,

    // At this writing, XXX_ENABLE_NAMESPACES will always be
    // undefined, and I've got no plans to define it elsewhere. It's
    // only mentioned here so that folks can do silly console tricks
    // to enable demos of the feature.
    areNamespacesEnabled: function() { return $window.XXX_ENABLE_NAMESPACES; }
  };
});
