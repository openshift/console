angular.module('app')

.directive('coLabel', function($interpolate, $compile) {
  'use strict';

  var linkTemplate = $interpolate('/search?type={{type}}&q={{key}}:{{value}}');

  return {
    templateUrl: '/static/module/label/label.html',
    restrict: 'E',
    replace: true,
    link: function(scope, el, attrs) {
      var ref;
      ref = linkTemplate({
        type: attrs.type,
        key: attrs.key,
        value: attrs.value
      });

      el.addClass('co-m-label--' + attrs.type);

      el.find('.co-m-label__circle')
        .text(attrs.type[0].toUpperCase());

      el.find('.co-m-label__key')
        .text(attrs.key);

      el.find('.co-m-label__value')
        .text(attrs.value);

      el.find('.co-m-label__link')
        .attr('href', ref);
    }
  };
})

.directive('coLabelList', function($interpolate, $compile) {
  'use strict';
  return {
    templateUrl: '/static/module/label/label-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      type: '@',
      labels: '='
    }
  };
});
