import { AffinityRowData, AffinityLabel, AffinityCondition, AffinityType } from './types';

export const isWeightValid = (focusedAffinity: AffinityRowData) =>
  focusedAffinity.condition === AffinityCondition.required ||
  (focusedAffinity.weight > 0 && focusedAffinity.weight <= 100);

export const isTermsInvalid = (terms: AffinityLabel[]) =>
  terms?.some(
    ({ key, values, operator }) =>
      !key || ((operator === 'In' || operator === 'NotIn') && values?.length === 0),
  );

export const getTopologyKeyValidation = ({ type, condition, topologyKey }: AffinityRowData) => {
  const topology = {
    isTopologyDisabled: false,
    isTopologyInvalid: false,
    topologyValidationMessage: '',
  };

  if (condition === AffinityCondition.required) {
    if (type === AffinityType.pod) {
      topology.topologyValidationMessage = 'Topology key must not be empty';
      topology.isTopologyInvalid = !topologyKey;
    } else {
      topology.isTopologyDisabled = true;
      topology.topologyValidationMessage = 'topologyKey is limited with current config';
    }
  } else if (type === AffinityType.podAnti) {
    topology.topologyValidationMessage = 'Empty topologyKey is interpreted as “all topologies”';
  }
  return topology;
};
