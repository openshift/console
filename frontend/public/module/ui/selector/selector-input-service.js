angular.module('bridge.ui')
  .factory('coSelectorInputSservice', function coSelectorInputSservice(_, k8s) {
    'use strict';

    return {
      toTags:               toTags,
      fromTags:             fromTags,
      looksLikeRequirement: looksLikeRequirement
    };

    // ---

    function toTags(selector) {
      var requirements = k8s.selector.toRequirements(selector || {});
      return requirements.map(requirementToTag);
    }

    function fromTags(tags, options) {
      var requirements = (tags || []).map(requirementFromTag);
      return k8s.selector.fromRequirements(requirements, options);
    }

    function looksLikeRequirement(tag, options) {
      var requirement = k8s.selectorRequirement.fromString(tag.text);
      return !!(requirement && (!_.get(options, 'basic') || requirement.operator === 'Equals')); // has to be boolean!
    }

    // ---

    function requirementToTag(requirement) {
      return {text: k8s.selectorRequirement.toString(requirement)};
    }

    function requirementFromTag(tag) {
      return k8s.selectorRequirement.fromString(tag.text);
    }
  })
;
