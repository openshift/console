angular.module('k8s')
.service('k8sUtil', function(_, k8sEnum, urlSvc) {
  'use strict';

  // TODO (sym3tri): refector this depencency once coreos-web is split up.
  this.parseURL = urlSvc.parse;

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

  // Iterates thru all own properties of an object and deletes anything with a null value.
  this.deleteNulls = function(obj) {
    _.each(obj, function(val, key, o) {
      if (val === null) {
        delete o[key];
      }
    });
  };

});
