describe('bridge.service', function() {
  'use strict';
  var yamlizeSvc;

  beforeEach(module('bridge.service'));

  beforeEach(inject(function(_yamlizeSvc_) {
    yamlizeSvc = _yamlizeSvc_;
  }));

  describe('yamlize', function() {
    it('serializes simple scalars correctly', function() {
      expect(yamlizeSvc.yamlize(false)).toEqual('false');
      expect(yamlizeSvc.yamlize(true)).toEqual('true');
      expect(yamlizeSvc.yamlize(1)).toEqual('1');
      expect(yamlizeSvc.yamlize(0.25)).toEqual('0.25');
      expect(yamlizeSvc.yamlize('simplestring')).toEqual('simplestring');
      expect(yamlizeSvc.yamlize('"')).toEqual('"\\""');
      expect(yamlizeSvc.yamlize('boots\nbeans')).toEqual('"boots\\nbeans"');
      expect(yamlizeSvc.yamlize('1')).toEqual('"1"');
      expect(yamlizeSvc.yamlize('false')).toEqual('"false"');
      expect(yamlizeSvc.yamlize('true')).toEqual('"true"');
      expect(yamlizeSvc.yamlize('null')).toEqual('"null"');
      expect(yamlizeSvc.yamlize('1.3e10')).toEqual('"1.3e10"');
      expect(yamlizeSvc.yamlize('1E1')).toEqual('"1E1"');
      expect(yamlizeSvc.yamlize('Hi ')).toEqual('"Hi "');
    });

    it('serializes typical Kubernetes scalars without quotes', function() {
      expect(yamlizeSvc.yamlize('172.17.4.99')).toEqual('172.17.4.99');
      expect(yamlizeSvc.yamlize('/api/v1/nodes/172.17.4.99')).toEqual('/api/v1/nodes/172.17.4.99');
      expect(yamlizeSvc.yamlize('2015-11-12T01:14:07Z')).toEqual('2015-11-12T01:14:07Z');
      expect(yamlizeSvc.yamlize('1021492Ki')).toEqual('1021492Ki');
      expect(yamlizeSvc.yamlize('CoreOS 845.0.0')).toEqual('CoreOS 845.0.0');
    });

    it('serializes empty collections correctly', function() {
      expect(yamlizeSvc.yamlize({})).toEqual('{}');
      expect(yamlizeSvc.yamlize([])).toEqual('[]');
    });

    it('serializes shallow collections correctly', function() {
      expect(yamlizeSvc.yamlize({a: 1, b: 2})).toEqual('a: 1\nb: 2');
      expect(yamlizeSvc.yamlize(['a', 1, 'b', 2])).toEqual('- a\n- 1\n- b\n- 2');
      expect(yamlizeSvc.yamlize({true: 1, 33: 2})).toEqual('"33": 2\n"true": 1');
      expect(yamlizeSvc.yamlize({'"': 'ok @ok'})).toEqual('"\\"": "ok @ok"');
      expect(yamlizeSvc.yamlize(['"', 'ok @ok', '2'])).toEqual('- "\\""\n- "ok @ok"\n- "2"');
      expect(yamlizeSvc.yamlize({a: 'b:'})).toEqual('a: "b:"');
      expect(yamlizeSvc.yamlize({'OR-': 'and - not'})).toEqual('"OR-": "and - not"');
    });

    it('serializes compound collections correctly', function() {
      expect(yamlizeSvc.yamlize({a: [1,2,3], b: {x: 1, y:2, z:3}, c: 'ok @ok'}))
        .toEqual('a: \n  - 1\n  - 2\n  - 3\nb: \n  x: 1\n  y: 2\n  z: 3\nc: "ok @ok"');
      expect(yamlizeSvc.yamlize([{a: {a: 'a'}}, 2, {b: {b: {b: []}}}]))
        .toEqual('- a: \n    a: a\n- 2\n- b: \n    b: \n      b: []');
    })

    var plausibleK8sJSON = {
      'kind': 'List',
      'apiVersion': 'v1',
      'metadata': {},
      'items': [
        {
          'kind': 'Node',
          'apiVersion': 'v1',
          'metadata': {
            'name': '172.17.4.99',
            'selfLink': '/api/v1/nodes/172.17.4.99',
            'uid': 'ac19d123-88da-11e5-af8b-0800275bd0a6',
            'resourceVersion': '70416',
            'creationTimestamp': '2015-11-12T01:14:07Z',
            'labels': {
              'kubernetes.io/hostname': '172.17.4.99',
              'mystery': 'true'
            }
          },
          'spec': {
            'externalID': '172.17.4.99'
          },
          'status': {
            'capacity': {
              'cpu': '1',
              'memory': '1021492Ki',
              'pods': '40'
            },
            'conditions': [
              {
                'type': 'Ready',
                'status': 'True',
                'lastHeartbeatTime': '2015-11-18T01:49:41Z',
                'lastTransitionTime': '2015-11-12T01:14:07Z',
                'reason': 'kubelet is posting ready status'
              }
            ],
            'addresses': [
              {
                'type': 'LegacyHostIP',
                'address': '172.17.4.99'
              }
            ],
            'nodeInfo': {
              'machineID': '2533358f7f664e379793c784646fc429',
              'systemUUID': 'C71C3B61-F493-45EE-A1E4-9CBB4C3E6F61',
              'bootID': 'ad6099f2-9c52-4837-a1ba-5e6d2fa2e275',
              'kernelVersion': '4.2.2-coreos-r1',
              'osImage': 'CoreOS 845.0.0',
              'containerRuntimeVersion': 'docker://1.8.3',
              'kubeletVersion': 'v1.0.6-release-1.0+388061f',
              'kubeProxyVersion': 'v1.0.6-release-1.0+388061f'
            }
          }
        }
      ]
    };

    var plausibleK8sYAML =
        'apiVersion: v1\n' +
        'items: \n' +
        '  - apiVersion: v1\n' +
        '    kind: Node\n' +
        '    metadata: \n' +
        '      creationTimestamp: 2015-11-12T01:14:07Z\n' +
        '      labels: \n' +
        '        kubernetes.io/hostname: 172.17.4.99\n' +
        '        mystery: \"true\"\n' +
        '      name: 172.17.4.99\n' +
        '      resourceVersion: \"70416\"\n' +
        '      selfLink: /api/v1/nodes/172.17.4.99\n' +
        '      uid: ac19d123-88da-11e5-af8b-0800275bd0a6\n' +
        '    spec: \n' +
        '      externalID: 172.17.4.99\n' +
        '    status: \n' +
        '      addresses: \n' +
        '        - address: 172.17.4.99\n' +
        '          type: LegacyHostIP\n' +
        '      capacity: \n' +
        '        cpu: \"1\"\n' +
        '        memory: 1021492Ki\n' +
        '        pods: \"40\"\n' +
        '      conditions: \n' +
        '        - lastHeartbeatTime: 2015-11-18T01:49:41Z\n' +
        '          lastTransitionTime: 2015-11-12T01:14:07Z\n' +
        '          reason: kubelet is posting ready status\n' +
        '          status: \"True\"\n' +
        '          type: Ready\n' +
        '      nodeInfo: \n' +
        '        bootID: ad6099f2-9c52-4837-a1ba-5e6d2fa2e275\n' +
        '        containerRuntimeVersion: docker://1.8.3\n' +
        '        kernelVersion: 4.2.2-coreos-r1\n' +
        '        kubeProxyVersion: v1.0.6-release-1.0+388061f\n' +
        '        kubeletVersion: v1.0.6-release-1.0+388061f\n' +
        '        machineID: 2533358f7f664e379793c784646fc429\n' +
        '        osImage: CoreOS 845.0.0\n' +
        '        systemUUID: C71C3B61-F493-45EE-A1E4-9CBB4C3E6F61\n' +
        'kind: List\n' +
        'metadata: {}'
    ;

    it('serializes kubernetes json in a reasonable way', function() {
      var generated = yamlizeSvc.yamlize(plausibleK8sJSON).split(/\n/);
      var equals = plausibleK8sYAML.split(/\n/);
      expect(generated.length).toEqual(equals.length);

      _.zip(generated, equals).forEach(function(ge) {
        expect(ge[0]).toEqual(ge[1]);
      });
    });
  });
});
