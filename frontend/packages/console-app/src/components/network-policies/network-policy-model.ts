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

const selectorToK8s = <T>(
  selector: string[][],
  emptyValue: Selector | undefined,
): Selector | undefined | ConversionError => {
  const filtered = selector.filter((pair) => pair.length >= 2 && pair[0] !== '');
  if (filtered.length > 0) {
    const obj = _.fromPairs(filtered);
    if (Object.keys(obj).length !== filtered.length) {
      return { kind: 'invalid', error: 'Duplicate keys found in label selector' };
    }
    return {
      matchLabels: obj,
    };
  }
  return emptyValue;
};

type Rule = { from?: K8SPeer[]; to?: K8SPeer[]; ports?: K8SPort[] };

const ruleToK8s = (
  rule: NetworkPolicyRule,
  direction: 'ingress' | 'egress',
): Rule | ConversionError => {
  const res: Rule = {};
  if (rule.peers.length > 0) {
    const peers = factorOutError(
      rule.peers.map((p) => {
        const peer: K8SPeer = {};
        if (p.ipBlock) {
          peer.ipBlock = {
            cidr: p.ipBlock.cidr,
            ...(p.ipBlock.except && { except: p.ipBlock.except.map((e) => e.value) }),
          };
        } else {
          if (p.podSelector) {
            const sel = selectorToK8s(p.podSelector, {});
            if (isError(sel)) {
              return sel;
            }
            peer.podSelector = sel;
          }
          if (p.namespaceSelector) {
            const sel = selectorToK8s(p.namespaceSelector, {});
            if (isError(sel)) {
              return sel;
            }
            peer.namespaceSelector = sel;
          }
        }
        return peer;
      }),
    );
    if (isError(peers)) {
      return peers;
    }
    if (direction === 'ingress') {
      res.from = peers;
    } else {
      res.to = peers;
    }
  }
  if (rule.ports.length > 0) {
    res.ports = rule.ports.map((p) => ({ protocol: p.protocol, port: Number(p.port) }));
  }
  return res;
};

export const networkPolicyToK8sResource = (
  from: NetworkPolicy,
): NetworkPolicyKind | ConversionError => {
  const podSelector = selectorToK8s(from.podSelector, null);
  if (isError(podSelector)) {
    return podSelector;
  }

  const res: NetworkPolicyKind = {
    kind: 'NetworkPolicy',
    apiVersion: 'networking.k8s.io/v1',
    metadata: {
      name: from.name,
      namespace: from.namespace,
    },
    spec: {
      podSelector,
      policyTypes: [],
    },
  };
  if (from.ingress.denyAll) {
    res.spec.policyTypes.push(networkPolicyTypeIngress);
    res.spec.ingress = [];
  } else if (from.ingress.rules.length > 0) {
    res.spec.policyTypes.push(networkPolicyTypeIngress);
    const rules = factorOutError(from.ingress.rules.map((r) => ruleToK8s(r, 'ingress')));
    if (isError(rules)) {
      return rules;
    }
    res.spec.ingress = rules;
  }
  if (from.egress.denyAll) {
    res.spec.policyTypes.push(networkPolicyTypeEgress);
    res.spec.egress = [];
  } else if (from.egress.rules.length > 0) {
    res.spec.policyTypes.push(networkPolicyTypeEgress);
    const rules = factorOutError(from.egress.rules.map((r) => ruleToK8s(r, 'egress')));
    if (isError(rules)) {
      return rules;
    }
    res.spec.egress = rules;
  }
  return res;
};
