angular.module('k8s')
.service('k8sUtil', function(_, k8sEnum) {
  'use strict';

  this.findByName = function(list, name) {
    return _.find(list, function(item) {
      return item.metadata && item.metadata.name === name;
    });
  };

  this.findByUID = function(list, uid) {
    return _.find(list, function(item) {
      return item.metadata && item.metadata.uid === uid;
    });
  };

  this.getKindEnumById = function(id) {
    return _.findWhere(k8sEnum.Kind, { id: id});
  };

  // Set all named properties of object to null if empty.
  this.nullifyEmpty = function(obj, props) {
    props.forEach(function(p) {
      if (_.isEmpty(obj[p])) {
        obj[p] = null;
      }
    });
  };

});
