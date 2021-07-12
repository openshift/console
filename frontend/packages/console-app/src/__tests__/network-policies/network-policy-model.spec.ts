import {
  NetworkPolicy,
  networkPolicyToK8sResource,
} from '../../components/network-policies/network-policy-model';

describe('NetworkPolicy model conversion', () => {
  it('should convert deny-all to K8s resource', () => {
    const policy: NetworkPolicy = {
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
    const converted = networkPolicyToK8sResource(policy);
    expect(converted).toEqual({
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: 'deny-all',
        namespace: 'ns',
      },
      spec: {
        egress: [],
        ingress: [],
        podSelector: null,
        policyTypes: ['Ingress', 'Egress'],
      },
    });
  });

  it('should convert same-namespace frontend pods rule to K8s resource', () => {
    const policy: NetworkPolicy = {
      name: 'same-namespace',
      namespace: 'ns',
      podSelector: [['role', 'backend']],
      ingress: {
        denyAll: false,
        rules: [
          {
            key: '1',
            peers: [
              {
                key: '1',
                podSelector: [['role', 'frontend']],
              },
            ],
            ports: [
              {
                key: '1',
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
    const converted = networkPolicyToK8sResource(policy);
    expect(converted).toEqual({
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
    });
  });

  it('should convert other-namespaces egress rule to K8s resource', () => {
    const policy: NetworkPolicy = {
      name: 'other-namespaces',
      namespace: 'ns',
      podSelector: [['role', 'backend']],
      egress: {
        denyAll: false,
        rules: [
          {
            key: '1',
            peers: [
              {
                key: '1',
                namespaceSelector: [['project', 'netpol']],
                podSelector: [
                  ['role', 'webservice'],
                  ['kind', 'geo-api'],
                ],
              },
            ],
            ports: [
              {
                key: '1',
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
    const converted = networkPolicyToK8sResource(policy);
    expect(converted).toEqual({
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
    });
  });

  it('should convert ipblock rule to K8s resource', () => {
    const policy: NetworkPolicy = {
      name: 'ipblock-rule',
      namespace: 'ns',
      podSelector: [],
      ingress: {
        denyAll: false,
        rules: [
          {
            key: '1',
            peers: [
              {
                key: '1',
                ipBlock: { cidr: '10.2.1.0/16', except: [{ key: '1', value: '10.2.1.0/12' }] },
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
        podSelector: null,
        policyTypes: ['Ingress'],
      },
    });
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
        podSelector: null,
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
});
