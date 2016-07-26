const yaml = require('js-yaml');

angular.module('bridge.ui')
.directive('yamlPolicy', function () {
  return {
    require: 'ngModel',
    link: function($scope, elm, attrs, ctrl) {
      ctrl.$validators.yamlPolicy = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          return false;
        };
        let json;
        try {
          json = yaml.safeLoad(viewValue);
        } catch (e) {
          return false;
        }

        let valid = true;
        if (!_.isObject(json)) {
          return false;
        }
        _.each(json, (pcr, pcrNum) => {
          const num = parseInt(pcrNum, 10);
          if (!isFinite(num)) {
            valid = false;
            return false;
          }
          if (!_.isObject(pcr)) {
            valid = false;
            return false;
          }
          _.each(pcr, (values, type) => {
            if (type !== 'binaryvalues' && type !== 'asciivalues' && type !== 'rawvalues') {
              valid = false;
            }
            if (!_.isArray(values)) {
              valid = false;
              return false;
            }
          });
        });
        if (valid) {
          $scope.policy_ = json;
        }
        return valid;
      };
    }
  };
});
