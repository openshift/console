angular.module('bridge.ui')
  .directive('coNamespaceSecretList', function coNamespaceSecretList() {
    'use strict';

    return {
      templateUrl: '/static/page/namespaces/co-namespace-secret-list.html',
      restrict: 'E',
      replace: true,
      scope: {
        namespace: '='
      },
      controller: 'coNamespaceSecretListCtrl'
    };
  })
;
