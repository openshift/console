/**
 * @fileoverview
 * Displays a different icon for different types of volumes, e.g. empty directories, secrets, etc.
 */

angular.module('bridge.ui')
.directive('coVolumeIcon', function(k8s) {
  'use strict';
  const volumeKind = k8s.enum.VolumeSource;

  return {
    template: `
      <span class="co-m-volume-icon">
        <i ng-if="faClass" class="fa{{faClass}}"></i>
        <span ng-bind="label"></span>
      </span>
    `,
    restrict: 'E',
    replace: true,
    link: function(scope, elem, attrs) {
      var kind = (attrs.kind || '');
      if (kind) {
        elem.addClass('co-m-volume-icon--' + kind);
      }
      scope.label = volumeKind[kind] ? volumeKind[kind].label : '';
      scope.faClass = faClass(volumeKind, kind);
    }
  };

});


function faClass(volumeKind, kind) {
  switch (kind) {
    case volumeKind.emptyDir.id:
      return ' fa-folder-open-o';
    case volumeKind.hostPath.id:
      return ' fa-files-o';
    case volumeKind.secret.id:
      return ' fa-lock';
    default:
      return '';
  }
}
