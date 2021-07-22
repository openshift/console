import { NetworkPolicyKind } from '@console/internal/module/k8s';
import {
  NetworkPolicy,
  networkPolicyFromK8sResource,
  networkPolicyToK8sResource,
} from '../../components/network-policies/network-policy-model';

const stubTFunc = (text: string, opts) => text.replace('{{path}}', opts.path);
const denyAll: NetworkPolicy = {
  name: 'deny-all',
  namespace: 'ns',
  podSelector: [],
  ingress: {
    denyAll: true,
    rules: [],
  },
  egress: {
    denyAll: true,
    rules: [],
  },
};
const k8sDenyAll: NetworkPolicyKind = {
  apiVersion: 'networking.k8s.io/v1',
  kind: 'NetworkPolicy',
  metadata: {
    name: 'deny-all',
    namespace: 'ns',
  },
  spec: {
    egress: [],
    ingress: [],
    podSelector: {},
    policyTypes: ['Ingress', 'Egress'],
  },
};
const sameNamespace: NetworkPolicy = {
  name: 'same-namespace',
  namespace: 'ns',
  podSelector: [['role', 'backend']],
  ingress: {
    denyAll: false,
    rules: [
      {
        key: expect.any(String),
        peers: [
          {
            key: expect.any(String),
            podSelector: [['role', 'frontend']],
          },
        ],
        ports: [
          {
            key: expect.any(String),
            port: '443',
            protocol: 'TCP',
          },
        ],
      },
    ],
  },
  egress: {
    denyAll: false,
    rules: [],
  },
};
const k8sSameNamespace: NetworkPolicyKind = {
  apiVersion: 'networking.k8s.io/v1',
  kind: 'NetworkPolicy',
  metadata: {
    name: 'same-namespace',
    namespace: 'ns',
  },
  spec: {
    ingress: [
      {
        from: [
          {
            podSelector: {
              matchLabels: { role: 'frontend' },
            },
          },
        ],
        ports: [
          {
            port: 443,
            protocol: 'TCP',
          },
        ],
      },
    ],
    podSelector: {
      matchLabels: { role: 'backend' },
    },
    policyTypes: ['Ingress'],
  },
};
const otherNamespace: NetworkPolicy = {
  name: 'other-namespaces',
  namespace: 'ns',
  podSelector: [['role', 'backend']],
  egress: {
    denyAll: false,
    rules: [
      {
        key: expect.any(String),
        peers: [
          {
            key: expect.any(String),
            namespaceSelector: [['project', 'netpol']],
            podSelector: [
              ['role', 'webservice'],
              ['kind', 'geo-api'],
            ],
          },
        ],
        ports: [
          {
            key: expect.any(String),
            port: '443',
            protocol: 'TCP',
          },
        ],
      },
    ],
  },
  ingress: {
    denyAll: false,
    rules: [],
  },
};
const k8sOtherNamespace: NetworkPolicyKind = {
  apiVersion: 'networking.k8s.io/v1',
  kind: 'NetworkPolicy',
  metadata: {
    name: 'other-namespaces',
    namespace: 'ns',
  },
  spec: {
    egress: [
      {
        to: [
          {
            namespaceSelector: {
              matchLabels: { project: 'netpol' },
            },
            podSelector: {
              matchLabels: { role: 'webservice', kind: 'geo-api' },
            },
          },
        ],
        ports: [
          {
            port: 443,
            protocol: 'TCP',
          },
        ],
      },
    ],
    podSelector: {
      matchLabels: { role: 'backend' },
    },
    policyTypes: ['Egress'],
  },
};
const ipBlockRule: NetworkPolicy = {
  name: 'ipblock-rule',
  namespace: 'ns',
  podSelector: [],
  ingress: {
    denyAll: false,
    rules: [
      {
        key: expect.any(String),
        peers: [
          {
            key: expect.any(String),
            ipBlock: {
              cidr: '10.2.1.0/16',
              except: [{ key: expect.any(String), value: '10.2.1.0/12' }],
            },
          },
        ],
        ports: [],
      },
    ],
  },
  egress: {
    denyAll: false,
    rules: [],
  },
};
const k8sIPBlockRule: NetworkPolicyKind = {
  apiVersion: 'networking.k8s.io/v1',
  kind: 'NetworkPolicy',
  metadata: {
    name: 'ipblock-rule',
    namespace: 'ns',
  },
  spec: {
    ingress: [
      {
        from: [
          {
            ipBlock: {
              cidr: '10.2.1.0/16',
              except: ['10.2.1.0/12'],
            },
          },
        ],
      },
    ],
    podSelector: {},
    policyTypes: ['Ingress'],
  },
};

describe('NetworkPolicy model conversion', () => {
  it('should convert deny-all resource', () => {
    const converted = networkPolicyToK8sResource(denyAll);
    expect(converted).toEqual(k8sDenyAll);
    const reconv = networkPolicyFromK8sResource(converted as NetworkPolicyKind, stubTFunc);
    expect(reconv).toEqual(denyAll);
  });

  it('should convert same-namespace frontend pods rule to K8s resource', () => {
    const converted = networkPolicyToK8sResource(sameNamespace);
    expect(converted).toEqual(k8sSameNamespace);
    const reconv = networkPolicyFromK8sResource(converted as NetworkPolicyKind, stubTFunc);
    expect(reconv).toEqual(sameNamespace);
  });

  it('should convert other-namespaces egress rule to K8s resource', () => {
    const converted = networkPolicyToK8sResource(otherNamespace);
    expect(converted).toEqual(k8sOtherNamespace);
    const reconv = networkPolicyFromK8sResource(converted as NetworkPolicyKind, stubTFunc);
    expect(reconv).toEqual(otherNamespace);
  });

  it('should convert ipblock rule to K8s resource', () => {
    const converted = networkPolicyToK8sResource(ipBlockRule);
    expect(converted).toEqual(k8sIPBlockRule);
    const reconv = networkPolicyFromK8sResource(converted as NetworkPolicyKind, stubTFunc);
    expect(reconv).toEqual(ipBlockRule);
  });

  it('should ignore selector with empty key', () => {
    const policy: NetworkPolicy = {
      name: 'empty-key-selector',
      namespace: 'ns',
      podSelector: [['', '']],
      ingress: {
        denyAll: false,
        rules: [
          {
            key: '1',
            peers: [
              {
                key: '1',
                podSelector: [['', '']],
              },
            ],
            ports: [],
          },
        ],
      },
      egress: {
        denyAll: false,
        rules: [],
      },
    };
    const converted = networkPolicyToK8sResource(policy);
    expect(converted).toEqual({
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: 'empty-key-selector',
        namespace: 'ns',
      },
      spec: {
        podSelector: {},
        policyTypes: ['Ingress'],
        ingress: [
          {
            from: [
              {
                podSelector: {},
              },
            ],
          },
        ],
      },
    });
  });

  it('should trigger error when converting invalid yaml', () => {
    const converted = networkPolicyFromK8sResource(
      {
        apiVersion: 'networking.k8s.io/v1',
        kind: 'NetworkPolicy',
        metadata: {
          name: 'with-error',
          namespace: 'ns',
        },
        spec: {
          egress: [],
          ingress: { whatever: 'wrong' },
          podSelector: {},
        } as any,
      },
      stubTFunc,
    );
    expect(converted).toEqual({
      error: 'console-app~Spec.ingress should be an Array.',
      kind: 'invalid',
    });
  });
});
