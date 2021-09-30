import { TFunction } from 'i18next';
import * as _ from 'lodash';
import {
  NetworkPolicyKind,
  NetworkPolicyPort as K8SPort,
  NetworkPolicyPeer as K8SPeer,
  Selector,
} from '@console/internal/module/k8s';

// Reference: https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.21/#networkpolicyspec-v1-networking-k8s-io

export interface NetworkPolicy {
  name: string;
  namespace: string;
  podSelector: string[][];
  ingress: NetworkPolicyRules;
  egress: NetworkPolicyRules;
}

export interface NetworkPolicyRules {
  rules: NetworkPolicyRule[];
  denyAll: boolean;
}

export interface NetworkPolicyRule {
  key: string;
  peers: NetworkPolicyPeer[];
  ports: NetworkPolicyPort[];
}

export interface NetworkPolicyPeer {
  key: string;
  podSelector?: string[][];
  namespaceSelector?: string[][];
  ipBlock?: NetworkPolicyIPBlock;
}

export interface NetworkPolicyIPBlock {
  cidr: string;
  except: { key: string; value: string }[];
}

export type NetworkPolicyPort = {
  key: string;
  protocol: string;
  port: string;
};

const networkPolicyTypeIngress = 'Ingress';
const networkPolicyTypeEgress = 'Egress';

interface ConversionError {
  kind: 'invalid' | 'unsupported';
  error: string;
}

const isError = <T>(result: T | ConversionError): result is ConversionError => {
  return result && (result as ConversionError).error !== undefined;
};
export const isNetworkPolicyConversionError = isError;

const factorOutError = <T>(list: (T | ConversionError)[]): T[] | ConversionError => {
  const err = list.find((r) => isError(r)) as ConversionError | undefined;
  if (err) {
    return err;
  }
  return list as T[];
};

const errors = {
  isMissing: (t: TFunction, path: string): ConversionError => ({
    kind: 'invalid',
    error: t('console-app~{{path}} is missing.', { path }),
  }),
  shouldBeAnArray: (t: TFunction, path: string): ConversionError => ({
    kind: 'invalid',
    error: t('console-app~{{path}} should be an Array.', { path }),
  }),
  shouldNotBeEmpty: (t: TFunction, path: string): ConversionError => ({
    kind: 'invalid',
    error: t('console-app~{{path}} should not be empty.', { path }),
  }),
  notSupported: (t: TFunction, path: string): ConversionError => ({
    kind: 'unsupported',
    error: t('console-app~{{path}} found in resource, but is not supported in form.', { path }),
  }),
};

export const selectorToK8s = (selector: string[][]): Selector => {
  const filtered = selector.filter((pair) => pair.length >= 2 && pair[0] !== '');
  if (filtered.length > 0) {
    return { matchLabels: _.fromPairs(filtered) };
  }
  return {};
};

const isValidSelector = (selector: string[][]): boolean => {
  const filtered = selector.filter((pair) => pair.length >= 2 && pair[0] !== '');
  if (filtered.length > 0) {
    const obj = _.fromPairs(filtered);
    return Object.keys(obj).length === filtered.length;
  }
  return true;
};

type Rule = { from?: K8SPeer[]; to?: K8SPeer[]; ports?: K8SPort[] };

const ruleToK8s = (rule: NetworkPolicyRule, direction: 'ingress' | 'egress'): Rule => {
  const res: Rule = {};
  if (rule.peers.length > 0) {
    const peers = rule.peers.map((p) => {
      const peer: K8SPeer = {};
      if (p.ipBlock) {
        peer.ipBlock = {
          cidr: p.ipBlock.cidr,
          ...(p.ipBlock.except && { except: p.ipBlock.except.map((e) => e.value) }),
        };
      } else {
        if (p.podSelector) {
          peer.podSelector = selectorToK8s(p.podSelector);
        }
        if (p.namespaceSelector) {
          peer.namespaceSelector = selectorToK8s(p.namespaceSelector);
        }
      }
      return peer;
    });
    if (direction === 'ingress') {
      res.from = peers;
    } else {
      res.to = peers;
    }
  }
  if (rule.ports.length > 0) {
    res.ports = rule.ports.map((p) => ({
      protocol: p.protocol,
      port: Number.isNaN(Number(p.port)) ? p.port : Number(p.port),
    }));
  }
  return res;
};

export const networkPolicyToK8sResource = (from: NetworkPolicy): NetworkPolicyKind => {
  const podSelector = selectorToK8s(from.podSelector);
  const policyTypes: string[] = [];
  const res: NetworkPolicyKind = {
    kind: 'NetworkPolicy',
    apiVersion: 'networking.k8s.io/v1',
    metadata: {
      name: from.name,
      namespace: from.namespace,
    },
    spec: {
      podSelector,
      policyTypes,
    },
  };
  if (from.ingress.denyAll) {
    policyTypes.push(networkPolicyTypeIngress);
    res.spec.ingress = [];
  } else if (from.ingress.rules.length > 0) {
    policyTypes.push(networkPolicyTypeIngress);
    res.spec.ingress = from.ingress.rules.map((r) => ruleToK8s(r, 'ingress'));
  }
  if (from.egress.denyAll) {
    policyTypes.push(networkPolicyTypeEgress);
    res.spec.egress = [];
  } else if (from.egress.rules.length > 0) {
    policyTypes.push(networkPolicyTypeEgress);
    res.spec.egress = from.egress.rules.map((r) => ruleToK8s(r, 'egress'));
  }
  return res;
};

const checkRulesValidity = (
  rules: NetworkPolicyRule[],
  t: TFunction,
): ConversionError | undefined => {
  for (const rule of rules) {
    for (const peer of rule.peers) {
      if (peer.podSelector && !isValidSelector(peer.podSelector)) {
        return {
          kind: 'invalid',
          error: t('console-app~Duplicate keys found in peer pod selector'),
        };
      }
      if (peer.namespaceSelector && !isValidSelector(peer.namespaceSelector)) {
        return {
          kind: 'invalid',
          error: t('console-app~Duplicate keys found in peer namespace selector'),
        };
      }
    }
  }
  return undefined;
};

export const checkNetworkPolicyValidity = (
  from: NetworkPolicy,
  t: TFunction,
): ConversionError | undefined => {
  if (!isValidSelector(from.podSelector)) {
    return { kind: 'invalid', error: t('console-app~Duplicate keys found in main pod selector') };
  }
  const errIn = checkRulesValidity(from.ingress.rules, t);
  if (errIn) {
    return errIn;
  }
  const errEg = checkRulesValidity(from.egress.rules, t);
  if (errEg) {
    return errEg;
  }
  return undefined;
};

export const networkPolicyNormalizeK8sResource = (from: NetworkPolicyKind): NetworkPolicyKind => {
  // This normalization is performed in order to make sure that converting from and to k8s back and forth remains consistent
  const clone = _.cloneDeep(from);
  if (clone.spec) {
    if (_.isEmpty(clone.spec.podSelector)) {
      clone.spec.podSelector = {};
    }
    if (!clone.spec.policyTypes) {
      clone.spec.policyTypes = [networkPolicyTypeIngress];
      if (_.has(clone.spec, 'egress')) {
        clone.spec.policyTypes.push(networkPolicyTypeEgress);
      }
    }
    if (
      !_.has(clone.spec, 'ingress') &&
      clone.spec.policyTypes.includes(networkPolicyTypeIngress)
    ) {
      clone.spec.ingress = [];
    }
    if (!_.has(clone.spec, 'egress') && clone.spec.policyTypes.includes(networkPolicyTypeEgress)) {
      clone.spec.egress = [];
    }
    [clone.spec.ingress, clone.spec.egress].forEach(
      (xgress) =>
        xgress &&
        xgress.forEach(
          (r) =>
            r.ports &&
            r.ports.forEach((p) => {
              p.port = Number.isNaN(Number(p.port)) ? p.port : Number(p.port);
            }),
        ),
    );
  }
  return clone;
};

const selectorFromK8s = (
  selector: Selector | undefined,
  path: string,
  t: TFunction,
): string[][] | ConversionError => {
  if (!selector) {
    return [];
  }
  if (selector.matchExpressions) {
    return errors.notSupported(t, `${path}.matchExpressions`);
  }
  const matchLabels = selector.matchLabels || {};
  return _.isEmpty(matchLabels) ? [] : _.map(matchLabels, (key: string, val: string) => [val, key]);
};

const portFromK8s = (port: K8SPort): NetworkPolicyPort | ConversionError => {
  return {
    key: _.uniqueId('port-'),
    protocol: port.protocol || 'TCP',
    port: port.port ? String(port.port) : '',
  };
};

const ipblockFromK8s = (
  ipblock: { cidr: string; except?: string[] },
  path: string,
  t: TFunction,
): NetworkPolicyIPBlock | ConversionError => {
  const res: NetworkPolicyIPBlock = {
    cidr: ipblock.cidr || '',
    except: [],
  };
  if (_.has(ipblock, 'except')) {
    if (!_.isArray(ipblock.except)) {
      return errors.shouldBeAnArray(t, `${path}.except`);
    }
    res.except = ipblock.except
      ? ipblock.except.map((e) => ({ key: _.uniqueId('exception-'), value: e }))
      : [];
  }
  return res;
};

const peerFromK8s = (
  peer: K8SPeer,
  path: string,
  t: TFunction,
): NetworkPolicyPeer | ConversionError => {
  const out: NetworkPolicyPeer = { key: _.uniqueId() };
  if (peer.ipBlock) {
    const ipblock = ipblockFromK8s(peer.ipBlock, `${path}.ipBlock`, t);
    if (isError(ipblock)) {
      return ipblock;
    }
    out.ipBlock = ipblock;
  } else {
    if (peer.podSelector) {
      const podSel = selectorFromK8s(peer.podSelector, `${path}.podSelector`, t);
      if (isError(podSel)) {
        return podSel;
      }
      out.podSelector = podSel;
    }
    if (peer.namespaceSelector) {
      const nsSel = selectorFromK8s(peer.namespaceSelector, `${path}.namespaceSelector`, t);
      if (isError(nsSel)) {
        return nsSel;
      }
      out.namespaceSelector = nsSel;
    }
  }
  if (!out.ipBlock && !out.namespaceSelector && !out.podSelector) {
    return errors.shouldNotBeEmpty(t, path);
  }
  return out;
};

const ruleFromK8s = (
  rule: Rule,
  path: string,
  peersKey: 'from' | 'to',
  t: TFunction,
): NetworkPolicyRule | ConversionError => {
  const converted: NetworkPolicyRule = {
    key: _.uniqueId(),
    ports: [],
    peers: [],
  };
  if (rule.ports) {
    if (!_.isArray(rule.ports)) {
      return errors.shouldBeAnArray(t, `${path}.ports`);
    }
    const ports = factorOutError(rule.ports.map((p) => portFromK8s(p)));
    if (isError(ports)) {
      return ports;
    }
    converted.ports = ports;
  }
  const rulePeers = rule[peersKey];
  if (rulePeers) {
    if (!_.isArray(rule[peersKey])) {
      return errors.shouldBeAnArray(t, `${path}.${peersKey}`);
    }
    const peers = factorOutError(
      rulePeers.map((p, idx) => peerFromK8s(p, `${path}.${peersKey}[${idx}]`, t)),
    );
    if (isError(peers)) {
      return peers;
    }
    converted.peers = peers;
  }
  return converted;
};

const rulesFromK8s = (
  rules: Rule[] | undefined,
  path: string,
  peersKey: 'from' | 'to',
  isAffected: boolean,
  t: TFunction,
): NetworkPolicyRules | ConversionError => {
  if (!isAffected) {
    return { rules: [], denyAll: false };
  }
  // Quoted from doc reference: "If this field is empty then this NetworkPolicy does not allow any traffic"
  if (!rules) {
    return { rules: [], denyAll: true };
  }
  if (!_.isArray(rules)) {
    return errors.shouldBeAnArray(t, path);
  }
  if (rules.length === 0) {
    return { rules: [], denyAll: true };
  }
  const converted = factorOutError(
    rules.map((r, idx) => ruleFromK8s(r, `${path}[${idx}]`, peersKey, t)),
  );
  if (isError(converted)) {
    return converted;
  }
  return { rules: converted, denyAll: false };
};

export const networkPolicyFromK8sResource = (
  from: NetworkPolicyKind,
  t: TFunction,
): NetworkPolicy | ConversionError => {
  if (!from.metadata) {
    return errors.isMissing(t, 'metadata');
  }
  if (!from.spec) {
    return errors.isMissing(t, 'spec');
  }
  // per spec, podSelector can be null, but key must be present
  if (!_.has(from.spec, 'podSelector')) {
    return errors.isMissing(t, 'spec.podSelector');
  }
  const podSelector = selectorFromK8s(from.spec.podSelector, 'spec.podSelector', t);
  if (isError(podSelector)) {
    return podSelector;
  }
  if (from.spec.policyTypes && !_.isArray(from.spec.policyTypes)) {
    return errors.shouldBeAnArray(t, 'spec.policyTypes');
  }

  // Note, the logic differs between ingress and egress, see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.21/#networkpolicyspec-v1-networking-k8s-io
  // A policy affects egress if it is explicitely specified in policyTypes, or if policyTypes isn't set and there is an egress section.
  // A policy affects ingress if it is explicitely specified in policyTypes, or if policyTypes isn't set, regardless the presence of an ingress sections.
  const affectsEgress = from.spec.policyTypes
    ? from.spec.policyTypes.includes(networkPolicyTypeEgress)
    : !!from.spec.egress;
  const affectsIngress = from.spec.policyTypes
    ? from.spec.policyTypes.includes(networkPolicyTypeIngress)
    : true;

  const ingressRules = rulesFromK8s(from.spec.ingress, 'spec.ingress', 'from', affectsIngress, t);
  if (isError(ingressRules)) {
    return ingressRules;
  }

  const egressRules = rulesFromK8s(from.spec.egress, 'spec.egress', 'to', affectsEgress, t);
  if (isError(egressRules)) {
    return egressRules;
  }

  return {
    name: from.metadata.name || '',
    namespace: from.metadata.namespace || '',
    podSelector,
    ingress: ingressRules,
    egress: egressRules,
  };
};
