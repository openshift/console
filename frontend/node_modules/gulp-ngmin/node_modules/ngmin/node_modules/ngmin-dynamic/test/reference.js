/*
 * Test cases where there's a reference to a module
 *
 *     var myMod = angular.module('myMod', []);
 *     myMod.controller( ... )
 *
 */

var assert          = require('should'),
    annotate        = require('./util').annotate,
    stringifyFnBody = require('./util').stringifyFnBody;


describe('annotate', function () {

  it('should annotate declarations on referenced modules', function () {
    var annotated = annotate(function () {
      var myMod = angular.module('myMod', []);
      myMod.controller('MyCtrl', function ($scope) {});
    });

    annotated.should.equal(stringifyFnBody(function () {
      var myMod = angular.module('myMod', []);
      myMod.controller('MyCtrl', [
        '$scope',
        function ($scope) {
        }
      ]);
    }));
  });

  it('should annotate declarations on referenced modules when reference is declared then initialized', function () {
    var annotated = annotate(function () {
      var myMod;
      myMod = angular.module('myMod', []);
      myMod.controller('MyCtrl', function ($scope) {});
    });

    annotated.should.equal(stringifyFnBody(function () {
      var myMod;
      myMod = angular.module('myMod', []);
      myMod.controller('MyCtrl', [
        '$scope',
        function ($scope) {
        }
      ]);
    }));
  });

  it('should annotate object-defined providers on referenced modules', function () {
    var annotated = annotate(function () {
      var myMod;
      myMod = angular.module('myMod', []);
      myMod.provider('MyService', { $get: function(service) {} });
    });

    annotated.should.equal(stringifyFnBody(function () {
      var myMod;
      myMod = angular.module('myMod', []);
      myMod.provider('MyService', {
        $get: ['service', function(service) {}]
      });
    }));
  });


  // TODO: it should annotate silly assignment chains

  it('should not annotate declarations on non-module objects', function () {
    var fn = function () {
      var myOtherMod = { controller: function () {} };
      var myMod, myOtherMod;
      myMod = angular.module('myMod', []);
      myOtherMod.controller('MyCtrl', function ($scope) {});
    };
    var annotated = annotate(fn);
    annotated.should.equal(stringifyFnBody(fn));
  });


});
