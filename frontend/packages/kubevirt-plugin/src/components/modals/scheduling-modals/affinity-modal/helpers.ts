import * as _ from 'lodash';
import * as classNames from 'classnames';
import { Kebab } from '@console/internal/components/utils';
import {
  getNodeAffinityRequiredTerms,
  getNodeAffinityPreferredTerms,
  getPodAffinityRequiredTerms,
  getPodAffinityPreferredTerms,
} from '../../../../selectors/affinity/selectors';
import {
  Affinity,
  NodeAffinity,
  PodAffinity,
  PodAffinityTerm,
  NodeAffinityTerm,
  PreferredNodeAffinityTerm,
  PreferredPodAffinityTerm,
  AffinityRowData,
  AffinityLabel,
} from './types';
import { AFFINITY_CONDITIONS } from '../shared/consts';

export const defaultNewAffinity = {
  type: 'nodeAffinity',
  condition: AFFINITY_CONDITIONS.required,
  expressions: [{ id: 0, key: '', values: [], operator: 'In' }],
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

const setIDsToEntity = (entity: any[]) => entity?.map((elm, i) => ({ ...elm, id: i }));
const flattenExpressions = (arr: AffinityLabel[]) =>
  arr?.map((aff) => {
    const affinityWithoutID = _.omit(aff, 'id');

    return aff.operator === 'Exists' || aff.operator === 'DoesNotExist'
      ? { ...affinityWithoutID, values: [] }
      : affinityWithoutID;
  });

const getNodeAffinityRows = (nodeAffinity: NodeAffinity): AffinityRowData[] => {
  const requiredTerms = getNodeAffinityRequiredTerms(nodeAffinity) || [];
  const preferredTerms = getNodeAffinityPreferredTerms(nodeAffinity) || [];

  const required = requiredTerms.map(({ matchExpressions, matchFields }, i) => ({
    id: `node-required-${i}`,
    type: 'nodeAffinity',
    condition: AFFINITY_CONDITIONS.required,
    expressions: setIDsToEntity(matchExpressions),
    fields: setIDsToEntity(matchFields),
  }));

  const preferred = preferredTerms.map(({ preference, weight }, i) => ({
    id: `node-preferred-${i}`,
    weight,
    type: 'nodeAffinity',
    condition: AFFINITY_CONDITIONS.preferred,
    expressions: setIDsToEntity(preference.matchExpressions),
    fields: setIDsToEntity(preference.matchFields),
  }));

  return [...required, ...preferred] as AffinityRowData[];
};

const getPodLikeAffinityRows = (
  podLikeAffinity: PodAffinity,
  isAnti: boolean = false,
): AffinityRowData[] => {
  const requiredTerms = getPodAffinityRequiredTerms(podLikeAffinity) || [];
  const preferredTerms = getPodAffinityPreferredTerms(podLikeAffinity) || [];

  const required = requiredTerms?.map((podAffinityTerm, i) => ({
    id: isAnti ? `pod-anti-required-${i}` : `pod-required-${i}`,
    type: isAnti ? 'podAntiAffinity' : 'podAffinity',
    condition: AFFINITY_CONDITIONS.required,
    expressions: setIDsToEntity(podAffinityTerm?.labelSelector?.matchExpressions),
    namespaces: podAffinityTerm?.namespaces,
    topologyKey: podAffinityTerm?.topologyKey,
  }));

  const preferred = preferredTerms?.map(({ podAffinityTerm, weight }, i) => ({
    id: isAnti ? `pod-anti-preferred-${i}` : `pod-preferred-${i}`,
    type: isAnti ? 'podAntiAffinity' : 'podAffinity',
    condition: AFFINITY_CONDITIONS.preferred,
    weight,
    expressions: setIDsToEntity(podAffinityTerm?.labelSelector?.matchExpressions),
    namespaces: podAffinityTerm?.namespaces,
    topologyKey: podAffinityTerm?.topologyKey,
  }));

  return [...required, ...preferred] as AffinityRowData[];
};

export const getRowsDataFromAffinity = (affinity: Affinity): AffinityRowData[] => [
  ...getNodeAffinityRows(affinity?.nodeAffinity),
  ...getPodLikeAffinityRows(affinity?.podAffinity),
  ...getPodLikeAffinityRows(affinity?.podAntiAffinity, true),
];

const getRequiredNodeTermFromRowData = ({
  expressions,
  fields,
}: AffinityRowData): NodeAffinityTerm => ({
  matchExpressions: flattenExpressions(expressions),
  matchFields: flattenExpressions(fields),
});

const getPreferredNodeTermFromRowData = ({
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

const getRequiredPodTermFromRowData = ({
  expressions,
  topologyKey,
}: AffinityRowData): PodAffinityTerm => ({
  labelSelector: {
    matchExpressions: flattenExpressions(expressions),
  },
  topologyKey,
});

const getPreferredPodTermFromRowData = ({
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
  const pickRows = (rowType, rowCondition, mapper) =>
    affinityRows
      .filter(({ type, condition }) => type === rowType && condition === rowCondition)
      .map((rowData) => mapper(rowData));

  const affinity = {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: pickRows(
          'nodeAffinity',
          AFFINITY_CONDITIONS.required,
          getRequiredNodeTermFromRowData,
        ),
      },
      preferredDuringSchedulingIgnoredDuringExecution: pickRows(
        'nodeAffinity',
        AFFINITY_CONDITIONS.preferred,
        getPreferredNodeTermFromRowData,
      ),
    },
    podAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: pickRows(
        'podAffinity',
        AFFINITY_CONDITIONS.required,
        getRequiredPodTermFromRowData,
      ),
      preferredDuringSchedulingIgnoredDuringExecution: pickRows(
        'podAffinity',
        AFFINITY_CONDITIONS.preferred,
        getPreferredPodTermFromRowData,
      ),
    },
    podAntiAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: pickRows(
        'podAntiAffinity',
        AFFINITY_CONDITIONS.required,
        getRequiredPodTermFromRowData,
      ),
      preferredDuringSchedulingIgnoredDuringExecution: pickRows(
        'podAntiAffinity',
        AFFINITY_CONDITIONS.preferred,
        getPreferredPodTermFromRowData,
      ),
    },
  };

  return affinity;
};
