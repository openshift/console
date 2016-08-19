angular.module('creme.filter').filter('userInviteStatus', function() {
  'use strict';

  return function(user) {
    if (!user) {
      return '';
    }
    if (user.dexID !== '') {
      return 'Accepted';
    }
    return 'Invited';
  };

});
