// import * as _ from 'lodash';
import {
  AffinityCondition,
  NodeAffinity,
  PodAffinity,
} from '../../components/modals/scheduling-modals/affinity-modal/types';

export const getRequiredScheduling = (affinity: NodeAffinity | PodAffinity) =>
  affinity?.[AffinityCondition.required];

export const getPreferredScheduling = (affinity: NodeAffinity | PodAffinity) =>
  affinity?.[AffinityCondition.preferred];

// Node Affinity
export const getNodeAffinityRequiredTerms = (affinity: NodeAffinity) =>
  affinity?.[AffinityCondition.required]?.nodeSelectorTerms;

export const getNodeAffinityPreferredTerms = (affinity: NodeAffinity) =>
  affinity?.[AffinityCondition.preferred];

// Pod Affinity
export const getPodAffinityRequiredTerms = (affinity: PodAffinity) =>
  affinity?.[AffinityCondition.required];

export const getPodAffinityPreferredTerms = (affinity: PodAffinity) =>
  affinity?.[AffinityCondition.preferred];
