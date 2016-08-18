angular.module('creme.svc').factory('localStorageSvc', function($window, authSvc) {
  'use strict';

  var svc = {
    get: get,
    set: set,
    removeItem: removeItem,
    clear: clearAll,
    setWithUserScope: setWithUserScope,
    getWithUserScope: getWithUserScope,
    removeItemWithUserScope: removeItemWithUserScope,
  };

  function removeItemWithUserScope(key) {
    return removeItem(makeUserScopedKey(key));
  }

  function getWithUserScope(key) {
    return get(makeUserScopedKey(key));
  }

  function setWithUserScope(key, value) {
    set(makeUserScopedKey(key), value);
  }

  // Makes a new storage key based on the currently logged in user id.
  function makeUserScopedKey(name) {
    var key, userID = authSvc.userID();
    if (!userID) {
      return '';
    }
    return userID + ':' + name;
  }

  function clearAll() {
    if (!$window.localStorage) {
      return null;
    }
    $window.localStorage.clear();
  }

  function removeItem(key) {
    if (!$window.localStorage || !key) {
      return null;
    }
    $window.localStorage.removeItem(key);
  }

  function get(key) {
    var obj, dataEnc;
    if (!$window.localStorage || !key) {
      return null;
    }
    dataEnc = $window.localStorage.getItem(key);
    if (dataEnc) {
      try {
        obj = JSON.parse(dataEnc);
      }
      catch(e) {
        obj = null;
      }
    }
    return obj;
  }

  function set(key, value) {
    if (!$window.localStorage || !key) {
      return;
    }
    $window.localStorage.setItem(key, JSON.stringify(value));
  }

  return svc;
});
