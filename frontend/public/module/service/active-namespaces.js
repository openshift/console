import {actions, getNamespacedRoute, getActiveNamespace, registerNamespaceFriendlyPrefix} from '../../ui/ui-actions';
import {angulars} from '../../components/react-wrapper';

angular.module('bridge.service')
.provider('activeNamespaceSvc', function() {
  'use strict';

  // This module supports users viewing resources based on namespace,
  // *not* their creation, deletion, editing of namespaces themselves.
  // That is, this is namespaces as part of the interface, not as the
  // object of the interface.

  // Most namespaced urls can't move from one namespace to another,
  // but happen to have prefixes that can - for example:
  //
  //   /ns/NS1/pods/MY_POD
  //
  // MY_POD is in general only associated with ns1, but /ns/$$/pods
  // is valid for all values of $$
  //
  // Only paths with registered namespace friendly prefixes can be
  // re-namespaced, so register your prefixes here as you define the
  // associated routes.

  this.registerNamespaceFriendlyPrefix = registerNamespaceFriendlyPrefix;

  this.$get = function() {
    return {
      setActiveNamespace: function(newActiveNamespace) {
        angulars.store.dispatch(actions.setActiveNamespace(newActiveNamespace));
      },
      getActiveNamespace: getActiveNamespace,

      // TODO(andy): This is just to keep the unit tests working
      formatNamespaceRoute: getNamespacedRoute,
    };
  }; // $get
});
