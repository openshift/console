angular.module('bridge.filter')
.filter('sysevents', function() {
  'use strict';

  // Whitelist of event reasons by "category" and involved object kind.
  var filterMap = {
    error: {
      Pod: ['failed', 'failedScheduling'],
      Node: ['offline'],
    },
    info: {
      Pod: ['created', 'pulled', 'killing', 'started', 'scheduled'],
      Node: ['online', 'starting'],
    }
  };

  // Map query kind input to event kind value.
  var kindMap = {
    pod: 'Pod',
    node: 'Node',
  };

  // Maps query prop name to a predicate filter.
  var predicateMap = {
    kind: kindFilter,
    category: categoryFilter,
    name: nameFilter
  };

  // Determines if the query is empty or not.
  function queryEmpty(q) {
    // Check whether at least one query key matches to available predicates.
    return !Object.keys(q || {}).some(predicateMap.hasOwnProperty.bind(predicateMap));
  }

  // Predicate function to filter by involved object kind.
  function kindFilter(query, evt) {
    return evt.object.involvedObject.kind === kindMap[query.kind];
  }

  // Predicate function to filter by event "category" (info, error, etc)
  function categoryFilter(query, evt) {
    var kind = evt.object.involvedObject.kind;
    var reason = evt.object.reason;
    var reasons = filterMap[query.category][kind];
    if (reasons && reasons.indexOf(reason) !== -1) {
      return true;
    }
    return false;
  }

  // Predicate function to filter by involved object name.
  function nameFilter(query, evt) {
    return evt.object.involvedObject.name === query.name;
  }

  // Compose an array of predicate functions into a single function.
  function composePredicates(query, predicates) {
    return function(evt) {
      var i = predicates.length - 1;
      while (i >= 0) {
        if (!predicates[i].call(null, query, evt)) {
          // Return early if any predicate fails.
          return false;
        }
        i--;
      }
      return true;
    };
  }

  // Determines which predicate filters should be applied based on the query input.
  function getPredicates(query) {
    return Object.keys(query)
      .filter(function(k) {
        // query field exists and is not empty
        return !!query[k];
      })
      .map(function(k) {
        return predicateMap[k];
      });
  }

  return function(events, query) {
    if (queryEmpty(query)) {
      return events;
    }
    var predicates = getPredicates(query);
    return events.filter(composePredicates(query, predicates));
  };

});
