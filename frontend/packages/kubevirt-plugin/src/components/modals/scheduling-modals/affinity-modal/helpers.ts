import * as _ from 'lodash';
import * as classNames from 'classnames';
import {
  Affinity,
  NodeAffinity,
  PodAffinity,
  PodAffinityTerm,
  RequiredNodeAffinityTerm,
  PreferredNodeAffinityTerm,
  PreferredPodAffinityTerm,
} from '@console/internal/module/k8s';
import { Kebab } from '@console/internal/components/utils';
import {
  getNodeAffinityRequiredTerms,
  getNodeAffinityPreferredTerms,
  getPodAffinityRequiredTerms,
  getPodAffinityPreferredTerms,
} from '../../../../selectors/affinity/selectors';
import { AffinityRowData, AffinityLabel } from './types';
import { AFFINITY_CONDITIONS } from '../shared/consts';

export const defaultNewAffinity = {
  type: 'nodeAffinity',
  condition: AFFINITY_CONDITIONS.preferred,
  expressions: [],
  fields: [],
  topologyKey: 'kubernetes.io/hostname',
} as AffinityRowData;

export const columnClasses = [
  classNames('col-lg-2'),
  classNames('col-lg-2'),
  classNames('col-lg-2'),
  classNames('col-lg-2'),
  Kebab.columnClass,
];

const getNodeAffinityRows = (nodeAffinity: NodeAffinity): AffinityRowData[] => {
  const rows = [];
  const requiredTerms = getNodeAffinityRequiredTerms(nodeAffinity);
  const preferredTerms = getNodeAffinityPreferredTerms(nodeAffinity);

  requiredTerms &&
    rows.push({
      id: 'node-required',
      type: 'nodeAffinity',
      condition: AFFINITY_CONDITIONS.required,
      expressions: _.flatten(
        requiredTerms.filter((term) => term.matchExpressions).map((term) => term.matchExpressions),
      ),
      fields: _.flatten(
        requiredTerms.filter((term) => term.matchFields).map((term) => term.matchFields),
      ),
    });

  preferredTerms &&
    preferredTerms.forEach(({ preference, weight }, i) =>
      rows.push({
        id: `node-preferred-${i}`,
        type: 'nodeAffinity',
        condition: AFFINITY_CONDITIONS.preferred,
        weight,
        expressions: preference?.matchExpressions,
        fields: preference?.matchFields,
      }),
    );
  return rows;
};

const getPodLikeAffinityRows = (
  podLikeAffinity: PodAffinity,
  isAnti: boolean = false,
): AffinityRowData[] => {
  const rows = [];
  const requiredTerms = getPodAffinityRequiredTerms(podLikeAffinity);
  const preferredTerms = getPodAffinityPreferredTerms(podLikeAffinity);

  requiredTerms &&
    requiredTerms.forEach((podAffinityTerm, i) =>
      rows.push({
        id: isAnti ? `pod-anti-required-${i}` : `pod-required-${i}`,
        type: isAnti ? 'podAntiAffinity' : 'podAffinity',
        condition: AFFINITY_CONDITIONS.required,
        expressions: podAffinityTerm?.labelSelector?.matchExpressions,
        labels: podAffinityTerm?.labelSelector?.matchLabels,
        namespaces: podAffinityTerm?.namespaces,
        topologyKey: podAffinityTerm?.topologyKey,
      }),
    );

  preferredTerms &&
    preferredTerms.forEach(({ podAffinityTerm, weight }, i) =>
      rows.push({
        id: isAnti ? `pod-anti-preferred-${i}` : `pod-preferred-${i}`,
        type: isAnti ? 'podAntiAffinity' : 'podAffinity',
        condition: AFFINITY_CONDITIONS.preferred,
        weight,
        expressions: podAffinityTerm?.labelSelector?.matchExpressions,
        labels: podAffinityTerm?.labelSelector?.matchLabels,
        namespaces: podAffinityTerm?.namespaces,
        topologyKey: podAffinityTerm?.topologyKey,
      }),
    );
  return rows;
};

export const getRowsDataFromAffinity = (affinity: Affinity): AffinityRowData[] => [
  ...getNodeAffinityRows(affinity?.nodeAffinity),
  ...getPodLikeAffinityRows(affinity?.podAffinity),
  ...getPodLikeAffinityRows(affinity?.podAntiAffinity, true),
];

const flattenExpressions = (arr: AffinityLabel[]) =>
  arr?.map((aff) => {
    const affinityWithoutID = _.omit(aff, 'id');

    return aff.operator === 'Exists' || aff.operator === 'DoesNotExist'
      ? { ...affinityWithoutID, values: [] }
      : affinityWithoutID;
  });

const getNodeRequiredAffinityFromData = (data: AffinityRowData): RequiredNodeAffinityTerm => {
  const terms = [];
  if (data?.expressions) {
    terms.push({ matchExpressions: flattenExpressions(data?.expressions) });
  }

  if (data?.fields) {
    terms.push({ matchFields: flattenExpressions(data?.fields) });
  }
  return { nodeSelectorTerms: terms };
};

const getNodePreferredAffinityFromData = ({
  weight,
  expressions,
  fields,
}: AffinityRowData): PreferredNodeAffinityTerm => ({
  weight,
  preference: {
    matchExpressions: flattenExpressions(expressions),
    matchFields: flattenExpressions(fields),
  },
});

const getPodRequiredAffinityFromData = ({
  expressions,
  topologyKey,
}: AffinityRowData): PodAffinityTerm => ({
  labelSelector: {
    matchExpressions: flattenExpressions(expressions),
  },
  topologyKey,
});

const getPodPreferredAffinityFromData = ({
  weight,
  expressions,
  topologyKey,
}: AffinityRowData): PreferredPodAffinityTerm => ({
  weight,
  podAffinityTerm: {
    labelSelector: {
      matchExpressions: flattenExpressions(expressions),
    },
    topologyKey,
  },
});

export const getAffinityFromRowsData = (affinityRows: AffinityRowData[]) => {
  const nodeAffinity = {} as NodeAffinity;
  const podAffinity = {} as PodAffinity;
  const podAntiAffinity = {} as PodAffinity;

  const nodeAffinityRequired = getNodeRequiredAffinityFromData(
    affinityRows.find(
      ({ type, condition }) =>
        type === 'nodeAffinity' && condition === AFFINITY_CONDITIONS.required,
    ),
  );

  const nodeAffinityPreferred = affinityRows
    .filter(
      ({ type, condition }) =>
        type === 'nodeAffinity' && condition === AFFINITY_CONDITIONS.preferred,
    )
    .map((aff) => getNodePreferredAffinityFromData(aff));

  const podAffinityRequired = affinityRows
    .filter(
      ({ type, condition }) => type === 'podAffinity' && condition === AFFINITY_CONDITIONS.required,
    )
    .map((aff) => getPodRequiredAffinityFromData(aff));
  const podAffinityPreferred = affinityRows
    .filter(
      ({ type, condition }) =>
        type === 'podAffinity' && condition === AFFINITY_CONDITIONS.preferred,
    )
    .map((aff) => getPodPreferredAffinityFromData(aff));

  const podAntiAffinityRequired = affinityRows
    .filter(
      ({ type, condition }) =>
        type === 'podAntiAffinity' && condition === AFFINITY_CONDITIONS.required,
    )
    .map((aff) => getPodRequiredAffinityFromData(aff));
  const podAntiAffinityPreferred = affinityRows
    .filter(
      ({ type, condition }) =>
        type === 'podAntiAffinity' && condition === AFFINITY_CONDITIONS.preferred,
    )
    .map((aff) => getPodPreferredAffinityFromData(aff));

  if (!_.isEmpty(nodeAffinityRequired?.nodeSelectorTerms)) {
    nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution = nodeAffinityRequired;
  }
  if (!_.isEmpty(nodeAffinityPreferred)) {
    nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution = nodeAffinityPreferred;
  }
  if (!_.isEmpty(podAffinityRequired)) {
    podAffinity.requiredDuringSchedulingIgnoredDuringExecution = podAffinityRequired;
  }
  if (!_.isEmpty(podAffinityPreferred)) {
    podAffinity.preferredDuringSchedulingIgnoredDuringExecution = podAffinityPreferred;
  }
  if (!_.isEmpty(podAntiAffinityRequired)) {
    podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution = podAntiAffinityRequired;
  }
  if (!_.isEmpty(podAntiAffinityPreferred)) {
    podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution = podAntiAffinityPreferred;
  }

  const affinity = {} as Affinity;
  if (!_.isEmpty(nodeAffinity)) {
    affinity.nodeAffinity = nodeAffinity;
  }
  if (!_.isEmpty(podAffinity)) {
    affinity.podAffinity = podAffinity;
  }
  if (!_.isEmpty(podAntiAffinity)) {
    affinity.podAntiAffinity = podAntiAffinity;
  }
  return affinity;
};
