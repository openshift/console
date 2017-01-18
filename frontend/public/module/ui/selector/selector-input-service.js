import {fromRequirements, toRequirements} from '../../k8s/selector';
import {fromString, toString} from '../../k8s/selector-requirement';

angular.module('bridge.ui')
  .factory('coSelectorInputSservice', function coSelectorInputSservice(_, k8s) {
    'use strict';

    function requirementToTag(requirement) {
      return {text: toString(requirement)};
    }

    function requirementFromTag(tag) {
      return fromString(tag.text);
    }

    // ---

    function toTags(selector) {
      var requirements = toRequirements(selector || {});
      return requirements.map(requirementToTag);
    }

    function fromTags(tags, options) {
      var requirements = (tags || []).map(requirementFromTag);
      return fromRequirements(requirements, options);
    }

    function looksLikeRequirement(tag, options) {
      var requirement = fromString(tag.text);
      return !!(requirement && (!_.get(options, 'basic') || requirement.operator === 'Equals')); // has to be boolean!
    }

    // ---

    return {
      toTags:               toTags,
      fromTags:             fromTags,
      looksLikeRequirement: looksLikeRequirement
    };
  })
;
