/**
 * @fileoverview
 * Dynamically display arbitrary k8s resource with icon and link.
 * Must supply string attributes for:
 *    namespace
 *    name
 *    uid
 *    kind
 */

angular.module('bridge.ui')
.directive('coResourceLink', function($compile, $interpolate, k8s) {
  'use strict';

  var linkInterpolater =
    $interpolate('<a href="/{{path}}/{{name}}" title="{{uid}}">{{name}}</a>');
  var linkInterpolaterWithNS =
    $interpolate('<a href="/ns/{{namespace}}/{{path}}/{{name}}" title="{{uid}}">{{name}}</a>');

  return {
    template: '<span class="co-resource-link"></span>',
    restrict: 'E',
    replace: true,
    link: function(scope, elem, attrs) {
      var iconDirectiveEl, linkEl, kind;

      if (attrs.kind) {
        kind = k8s.util.getKindEnumById(attrs.kind.toLowerCase());
      }

      if (kind) {
        iconDirectiveEl = angular.element('<co-resource-icon kind="' + kind.id + '"></co-resource-icon>');
        $compile(iconDirectiveEl)(scope);
        elem.append(iconDirectiveEl);

        attrs.path = kind.path;
        if (attrs.namespace) {
          linkEl = angular.element(linkInterpolaterWithNS(attrs));
        } else {
          linkEl = angular.element(linkInterpolater(attrs));
        }
        elem.append(linkEl);
      } else if (attrs.name) {
        elem.append(angular.element('<span>' + attrs.name + '</span>'));
      }

    },
  };

});
