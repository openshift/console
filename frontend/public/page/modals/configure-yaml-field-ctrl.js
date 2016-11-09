angular.module('bridge.page')
.controller('ConfigureYamlFieldCtrl', ($scope, $uibModalInstance, $window, k8s, _, k8sQuery, path, inputType, modalText, modalTitle, callbacks) => {
  'use strict';

  $scope.inputType = inputType;
  $scope.modalText = modalText;
  $scope.modalTitle = modalTitle;
  $scope.resource = null;

  $scope.fields = {
    value: null
  };

  $scope.save = () => {
    callbacks.invalidateState(true);

    let value = $scope.fields.value;
    if (k8sQuery.kind === k8s.kinds.SECRET) {
      value = $window.btoa(value);
    }

    const applyUpdate = () => {
      if (!$scope.resource) {
        const newResource = {
          metadata: {
            name: k8sQuery.name,
            namespace: k8sQuery.namespace
          }
        };
        _.set(newResource, path, value);
        $scope.requestPromise = k8s.resource.create(k8sQuery.kind, newResource);
      } else {
        const patchPath = `/${path.replace('.', '/')}`;
        const patch = [{ op: 'replace', path: patchPath, value: value }];
        $scope.requestPromise = k8s.resource.patch(k8sQuery.kind, $scope.resource, patch);
      }
      $scope.requestPromise.then((result) => {
        $uibModalInstance.close(result);
      }).catch(() => {
        callbacks.invalidateState(false);
      });
    };

    if (callbacks.inputValidator) {
      $scope.requestPromise = callbacks.inputValidator(value).then(applyUpdate);
    } else {
      applyUpdate();
    }
  };

  $scope.cancel = () => {
    callbacks.invalidateState(false);
    $uibModalInstance.dismiss('cancel');
  };

  $scope.resourceLoading = true;
  k8s.resource.get(k8sQuery.kind, k8sQuery.name, k8sQuery.namespace)
    .then((resource) => {
      $scope.resource = resource;
      $scope.resourceLoading = false;

      let value = _.get(resource, path);
      if (k8sQuery.kind === k8s.kinds.SECRET) {
        value = $window.atob(value);
      }
      $scope.fields.value = value;
    }).catch(() => {
      $scope.resourceLoading = false;
    });
})
.controller('ConfigureYamlFieldFormCtrl', ($scope) => {
  'use strict';
  $scope.submit = $scope.save;
});
