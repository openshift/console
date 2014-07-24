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

  it('should annotate directive controllers', function () {
    var annotated = annotate(function () {
      angular.module('myMod', []).
        directive('myDir', function () {
          return {
            controller: function ($scope) { $scope.test = true; }
          };
        });
    });

    annotated.should.equal(stringifyFnBody(function () {
      angular.module('myMod', []).
        directive('myDir', function () {
          return {
            controller: [
              '$scope',
              function ($scope) { $scope.test = true; }
            ]
          };
        });
    }));
  });

  it('should annotate directive controllers of annotated directives', function () {
    var annotated = annotate(function () {
      angular.module('myMod', []).
        directive('myDir', function ($window) {
          return {
            controller: function ($scope) { $scope.test = true; }
          };
        });
    });

    annotated.should.equal(stringifyFnBody(function () {
      angular.module('myMod', []).
        directive('myDir', ['$window', function ($window) {
          return {
            controller: [
              '$scope',
              function ($scope) { $scope.test = true; }
            ]
          };
        }]);
    }));
  });

});
