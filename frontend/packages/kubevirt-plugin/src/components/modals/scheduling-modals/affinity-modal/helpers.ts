import * as _ from 'lodash';
import * as classNames from 'classnames';
import { getName } from '@console/shared';
import { Kebab } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
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
  AffinityType,
  AffinityCondition,
} from './types';

export const defaultNewAffinity = {
  type: AffinityType.node,
  condition: AffinityCondition.required,
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
    type: AffinityType.node,
    condition: AffinityCondition.required,
    expressions: setIDsToEntity(matchExpressions),
    fields: setIDsToEntity(matchFields),
  }));

  const preferred = preferredTerms.map(({ preference, weight }, i) => ({
    id: `node-preferred-${i}`,
    weight,
    type: AffinityType.node,
    condition: AffinityCondition.preferred,
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
    type: isAnti ? AffinityType.podAnti : AffinityType.pod,
    condition: AffinityCondition.required,
    expressions: setIDsToEntity(podAffinityTerm?.labelSelector?.matchExpressions),
    namespaces: podAffinityTerm?.namespaces,
    topologyKey: podAffinityTerm?.topologyKey,
  }));

  const preferred = preferredTerms?.map(({ podAffinityTerm, weight }, i) => ({
    id: isAnti ? `pod-anti-preferred-${i}` : `pod-preferred-${i}`,
    type: isAnti ? AffinityType.podAnti : AffinityType.pod,
    condition: AffinityCondition.preferred,
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
  if (affinityRows.length === 0) {
    return null;
  }

  const pickRows = (rowType, rowCondition, mapper) =>
    affinityRows
      .filter(({ type, condition }) => type === rowType && condition === rowCondition)
      .map((rowData) => mapper(rowData));

  const affinity = {
    nodeAffinity: {
      [AffinityCondition.required]: {
        nodeSelectorTerms: pickRows(
          AffinityType.node,
          AffinityCondition.required,
          getRequiredNodeTermFromRowData,
        ),
      },
      [AffinityCondition.preferred]: pickRows(
        AffinityType.node,
        AffinityCondition.preferred,
        getPreferredNodeTermFromRowData,
      ),
    },
    podAffinity: {
      [AffinityCondition.required]: pickRows(
        AffinityType.pod,
        AffinityCondition.required,
        getRequiredPodTermFromRowData,
      ),
      [AffinityCondition.preferred]: pickRows(
        AffinityType.pod,
        AffinityCondition.preferred,
        getPreferredPodTermFromRowData,
      ),
    },
    podAntiAffinity: {
      [AffinityCondition.required]: pickRows(
        AffinityType.podAnti,
        AffinityCondition.required,
        getRequiredPodTermFromRowData,
      ),
      [AffinityCondition.preferred]: pickRows(
        AffinityType.podAnti,
        AffinityCondition.preferred,
        getPreferredPodTermFromRowData,
      ),
    },
  };

  return affinity;
};

export const getIntersectedQualifiedNodes = ({
  expressions,
  fields,
  expressionNodes,
  fieldNodes,
}: {
  expressions: AffinityLabel[];
  fields: AffinityLabel[];
  expressionNodes: NodeKind[];
  fieldNodes: NodeKind[];
}) => {
  if (expressions.length > 0 && fields.length > 0) {
    return _.intersectionWith(expressionNodes, fieldNodes, (a, b) => getName(a) === getName(b));
  }
  if (expressions.length > 0) {
    return expressionNodes;
  }
  if (fields.length > 0) {
    return fieldNodes;
  }
  return [];
};

export const getAvailableAffinityID = (affinities: AffinityRowData[]) => {
  const idSet = new Set(affinities.map((aff) => aff.id));
  let id = 1;
  while (idSet.has(id.toString())) {
    id++;
  }
  return id.toString();
};
