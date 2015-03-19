// This file is a module definition hack to ensure this file loads before all others.
// TODO(sym3tri): Should be fixed in the build process instead.
angular.module('k8s', ['underscore', 'core.pkg', 'coreos.services']);
