/**
 * @fileoverview
 * Simple convenience directive for displaying status icons with text.
 */

angular.module('app')
.directive('coStatus', function($, _) {
  'use strict';

  return {
    templateUrl: '/static/module/icons/status.html',
    restrict: 'E',
    replace: true,
    link: function(scope, elem, attrs) {
      var iconClasses, rootClasses, iconEl, textEl;

      iconClasses = {
        ok: 'fa-check-circle-o',
        warning: 'fa-warning',
        critical: 'fa-times-circle-o',
        unknown: 'fa-question-circle'
      };

      rootClasses = {
        ok: 'co-m-status--ok',
        warning: 'co-m-status--warning',
        critical: 'co-m-status--critical',
        unknown: 'co-m-status--unknown'
      };

      iconEl = $('.co-m-status__icon', elem);
      textEl = $('.co-m-status__text', elem);

      function removeClasses() {
        _.each(rootClasses, elem.removeClass);
        _.each(iconClasses, iconEl.removeClass);
      }

      attrs.$observe('state', function(state) {
        removeClasses();
        if (state) {
          elem.addClass(rootClasses[state]);
          iconEl.addClass(iconClasses[state]);
        }
      });

      attrs.$observe('text', function(text) {
        textEl.text(text);
      });

    }
  };

});
