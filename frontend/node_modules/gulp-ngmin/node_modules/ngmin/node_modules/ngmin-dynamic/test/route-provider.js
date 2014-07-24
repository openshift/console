/*
 * Test annotations within the Directive Definition Object (DDO):
 *
 *    angular.module('myMod', []).directive('whatever', function () {
 *      return {
 *        controller: function ($scope) { ... }  // <--- this needs annotations
 *      };
 *    })
 *
 */

var assert          = require('should'),
    annotate        = require('./util').annotate,
    stringifyFnBody = require('./util').stringifyFnBody;


describe('annotate', function () {

  it('should annotate $routeProvider.when()', function () {
    var annotated = annotate(function () {
      angular.module('myMod', []).
        config(function ($routeProvider) {
          $routeProvider.when('path', {
            controller: function ($scope) {
              $scope.works = true;
            }
          });
        });
    });

    annotated.should.equal(stringifyFnBody(function () {
      angular.module('myMod', []).
        config(['$routeProvider', function ($routeProvider) {
          $routeProvider.when('path', {
            controller: ['$scope', function ($scope) {
              $scope.works = true;
            }]
          });
        }]);
    }));
  });


  it('should annotate chained $routeProvider.when()', function () {
    var annotated = annotate(function () {
      angular.module('myMod', []).
        config(function ($routeProvider) {
          $routeProvider.
            when('path', {
              controller: function ($scope) {
                $scope.works = true;
              }
            }).
            when('other/path', {
              controller: function ($http) {
                $http.get();
              }
            });
        });
    });

    annotated.should.equal(stringifyFnBody(function () {
      angular.module('myMod', []).
        config(['$routeProvider', function ($routeProvider) {
          $routeProvider.
            when('path', {
              controller: ['$scope', function ($scope) {
                $scope.works = true;
              }]
            }).
            when('other/path', {
              controller: ['$http', function ($http) {
                $http.get();
              }]
            });
        }]);
    }));
  });


  it('should annotate $routeProvider when there are other services to configure', function () {
    var annotated = annotate(function () {
      angular.module('myMod', []).
        config(function (fooConfig, $routeProvider) {
          $routeProvider.
            when('path', {
              controller: function ($scope) {
                $scope.works = true;
              }
            });
        });
    });

    annotated.should.equal(stringifyFnBody(function () {
      angular.module('myMod', []).
        config(['fooConfig', '$routeProvider', function (fooConfig, $routeProvider) {
          $routeProvider.
            when('path', {
              controller: ['$scope', function ($scope) {
                $scope.works = true;
              }]
            });
        }]);
    }));
  });

  if (global.Proxy && Proxy.createFunction) {
    it('should noop non-$routeProvider services in a config block', function () {
      var annotated = annotate(function () {
        angular.module('myMod', []).
          config(function (fooConfig, $routeProvider) {
            fooConfig({}).bar.baz();
            $routeProvider.
              when('path', {
                controller: function ($scope) {
                  $scope.works = true;
                }
              });
          });
      });

      annotated.should.equal(stringifyFnBody(function () {
        angular.module('myMod', []).
          config(['fooConfig', '$routeProvider', function (fooConfig, $routeProvider) {
            fooConfig({}).bar.baz();
            $routeProvider.
              when('path', {
                controller: ['$scope', function ($scope) {
                  $scope.works = true;
                }]
              });
          }]);
      }));
    });
  }

});
