angular.module('creme.filter').filter('userRole', function() {
  'use strict';

  return function(user) {
    if (!user) {
      return '';
    }
    switch (user.role) {
      case 1:
        return 'Admin';
    }
    return 'Read Only';
  };

});
