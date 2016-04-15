angular.module('bridge.filter')
.filter('usersFilter', function() {
  'use strict';

  return function(users, query) {
    if (!users) {
      return;
    }
    users.sort(function (b, a) {
      return (a.status < b.status);
    });

    if (!query) {
      return users;
    }

    return users.filter(function (user) {
      return user.email.indexOf(query) !== -1 || user.displayName.indexOf(query) !== -1;
    });
  };
});
