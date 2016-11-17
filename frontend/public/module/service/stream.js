// Angular's $http is slightly too high level to allow us to observe
// log messages streamed in via simple "HTTP Streaming" connections,
// so we have to roll our own simple service.

angular.module('bridge.service')
.factory('streamSvc', function(_, $q, $window) {
  'use strict';

  return {
    stream: function(url) {
      var deferred = $q.defer();
      var xhr = new $window.XMLHttpRequest();
      var offset = 0;

      var nextChunk = function() {
        var remainder = xhr.responseText.substr(offset);
        offset = xhr.responseText.length;
        deferred.notify(remainder);
      };

      var processResponse = function(e) {
        var response = e.target;

        if (response.status === 200) {
          deferred.resolve();
        } else {
          var msg = 'error';
          try {
            msg = JSON.parse(response.responseText).message;
          } catch(e) {
            throw new Error(e);
          }
          deferred.reject(msg);
        }
      };

      xhr.addEventListener('progress', nextChunk);
      xhr.addEventListener('load', nextChunk);
      xhr.addEventListener('loadend', processResponse);
      xhr.addEventListener('error', function() {
        deferred.reject('error');
      });
      xhr.addEventListener('abort', function() {
        deferred.reject('abort');
      });

      xhr.open('GET', url, true);
      xhr.send();

      return {
        promise: deferred.promise,
        abort: function() {
          xhr.abort();
        }
      };
    }
  };
});
