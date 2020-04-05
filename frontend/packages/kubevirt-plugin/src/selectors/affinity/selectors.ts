// import * as _ from 'lodash';
import { NodeAffinity, PodAffinity } from '@console/internal/module/k8s';

export const getRequiredScheduling = (affinity: NodeAffinity | PodAffinity) =>
  affinity?.requiredDuringSchedulingIgnoredDuringExecution;

export const getPreferredScheduling = (affinity: NodeAffinity | PodAffinity) =>
  affinity?.preferredDuringSchedulingIgnoredDuringExecution;

// Node Affinity
export const getNodeAffinityRequiredTerms = (affinity: NodeAffinity) =>
  affinity?.requiredDuringSchedulingIgnoredDuringExecution?.nodeSelectorTerms;

export const getNodeAffinityPreferredTerms = (affinity: NodeAffinity) =>
  affinity?.preferredDuringSchedulingIgnoredDuringExecution;

// Pod Affinity
export const getPodAffinityRequiredTerms = (affinity: PodAffinity) =>
  affinity?.requiredDuringSchedulingIgnoredDuringExecution;

export const getPodAffinityPreferredTerms = (affinity: PodAffinity) =>
  affinity?.preferredDuringSchedulingIgnoredDuringExecution;
