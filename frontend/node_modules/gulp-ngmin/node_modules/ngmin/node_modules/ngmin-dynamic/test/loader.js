/*
 * Test for angular modules that are wrapped by goofy
 * 3rd party loaders like Require.js
 */

var assert          = require('should'),
    annotate        = require('./util').annotate,
    stringifyFnBody = require('./util').stringifyFnBody;


describe('annotate', function () {

  it('should annotate modules inside of loaders', function () {
    var annotated = annotate(function () {
      var define = function (a, b) { b(); };
      define(["./thing"], function(thing) {
        angular.module('myMod', []).
          controller('MyCtrl', function ($scope) {});
      });
    });

    annotated.should.equal(stringifyFnBody(function () {
      var define = function (a, b) { b(); };
      define(["./thing"], function(thing) {
        angular.module('myMod', []).
          controller('MyCtrl', ['$scope', function ($scope) {}]);
      });
    }));
  });

  it('should annotate module refs inside of loaders', function () {
    var annotated = annotate(function () {
      var define = function (a, b) { b(); };
      define(["./thing"], function(thing) {
        var myMod = angular.module('myMod', []);
        myMod.controller('MyCtrl', function ($scope) {});
        return myMod;
      });

    });

    annotated.should.equal(stringifyFnBody(function () {
      var define = function (a, b) { b(); };
      define(["./thing"], function(thing) {
        var myMod = angular.module('myMod', []);
        myMod.controller('MyCtrl', ['$scope', function ($scope) {}]);
        return myMod;
      });
    }));
  });


});
