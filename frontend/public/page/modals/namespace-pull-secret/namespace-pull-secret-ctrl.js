import {CONST} from '../../../const';

angular.module('bridge.page')
  .directive('onFileChange', () => {
    return {
      restrict: 'A',
      link: (scope, element, attrs) => {
        const onChangeHandler = scope.$eval(attrs.onFileChange);
        element.bind('change', function() {
          scope.$apply(function() {
            const files = element[0].files;
            if (files) {
              onChangeHandler(files);
            }
          });
        });
      }
    };
  })
  .controller('NamespacePullSecretCtrl', function($scope, $uibModalInstance, $window, k8s, namespace, pullSecret) {
    'use strict';

    $scope.namespace = namespace;
    $scope.fields    = {
      method: 'form',
      name: _.get(pullSecret, 'metadata.name')
    };
    $scope.model     = {
      data: null,
      existingData: null,
      invalidData: false,
      invalidJson: false,
      isNew: !pullSecret
    };

    try {
      $scope.model.existingData = pullSecret && $window.atob(pullSecret.data[CONST.PULL_SECRET_DATA]);

      if ($scope.model.existingData) {
        let data = JSON.parse($scope.model.existingData);
        if (!data || !data.auths) {
          throw 'Invalid data';
        }
        const keys = Object.keys(data.auths);
        if (keys.length > 1) {
          // multiple auths are stored in this one secret.
          // we'll display the first secret, but upon saving, the
          // others will get erased
          $scope.model.invalidData = true;
        }
        else if (keys.length < 1) {
          throw 'Invalid data';
        }
        const address = keys[0];
        $scope.fields.address = address;
        $scope.fields.email = data.auths[address].email;
        const auth = window.atob(data.auths[address].auth);
        const authParts = auth.split(':');
        if (authParts.length === 1) {
          $scope.fields.username = '';
          $scope.fields.password = authParts[0];
        } else if (authParts.length === 2) {
          $scope.fields.username = authParts[0];
          $scope.fields.password = authParts[1];
        } else {
          throw 'Invalid data';
        }
      }
    } catch (error) {
      $scope.model.invalidData = true;
    }

    $scope.fileNameChanged = function(files) {
      $scope.model.data = null;
      $scope.model.invalidJson = false;
      const file = files[0];

      if (!file || file.type !== 'application/json') {
        $scope.model.invalidJson = true;
        return;
      }

      var reader = new FileReader();
      reader.onload = (event) => {
        const input = event.target.result;
        try {
          JSON.parse(input);
        } catch (error) {
          $scope.model.invalidJson = true;
          return;
        }
        $scope.model.data = input;
      };
      reader.readAsText(file, 'UTF-8');
    };

    const generateSecretData = () => {
      let data;
      if ($scope.fields.method === 'upload') {
        data = $scope.model.data;
      } else {
        const config = {
          auths: {}
        };

        let authParts  = [];
        const username = $scope.fields.username;
        const password = $scope.fields.password;

        if (_.trim(username).length >= 1) {
          authParts.push(username);
        }
        authParts.push(password);

        config.auths[$scope.fields.address] = {
          auth:  $window.btoa(authParts.join(':')),
          email: $scope.fields.email
        };

        data = JSON.stringify(config);
      }

      return $window.btoa(data);
    };

    const submitCreate = () => {
      const data = {};
      data[CONST.PULL_SECRET_DATA] = generateSecretData();

      return k8s.secrets.create({
        metadata: {
          name:      $scope.fields.name,
          namespace: namespace.metadata.name
        },
        data: data,
        type: CONST.PULL_SECRET_TYPE
      });
    };

    const submitUpdate = () => {
      return k8s.resource.patch(k8s.kinds.SECRET, pullSecret, [{
        op:    'replace',
        path:  `/data/${CONST.PULL_SECRET_DATA}`,
        value: generateSecretData()
      }]);
    };

    $scope.submit = () => {
      $scope.pullSecretUpdated = ($scope.model.isNew ? submitCreate : submitUpdate)()
        .then($uibModalInstance.close.bind($uibModalInstance));
    };
  })
;
