angular.module('bridge.ui')

.directive('coLabel', function($interpolate, k8s) {
  'use strict';

  var linkTemplate = $interpolate('/search?kind={{kind}}&q={{query}}');

  return {
    templateUrl: '/static/module/ui/labels/label.html',
    restrict: 'E',
    replace: true,
    link: function(scope, el, attrs) {
      var ref, linkEl, labelObj;

      labelObj = {};
      labelObj[attrs.key] = attrs.value;
      ref = linkTemplate({
        kind: attrs.kind,
        query: k8s.labels.linkEncode(labelObj),
      });

      linkEl = el.find('.co-m-label__link');
      linkEl.attr('href', ref);

      if (attrs.expand) {
        el.addClass('co-m-label--expand');
      }

      el.addClass('co-m-label--' + attrs.kind);

      el.find('.co-m-label__key')
        .text(attrs.key);

      el.find('.co-m-label__value')
        .text(attrs.value);
    }
  };
});
