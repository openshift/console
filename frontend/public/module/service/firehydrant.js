angular.module('bridge.service')
.service('firehydrant', function(_, $interval, $rootScope, $routeParams, k8s, resourceMgrSvc) {
  'use strict';

  this.objects = {
    nodes: [],
    policies: [],
  }
  this.loadErrors = {
    nodes: false,
    policies: false,
  }

  const subscribe = (type, scope, onSuccess, onError) => {
    const off1 = scope.$on(`firehydrant-${type}`, (event, objects) => onSuccess(objects));
    const off2 = scope.$on(`firehydrant-${type}-error`, (event, err) => onError(err));

    if (this.loadErrors[type]) {
      onError();
    } else {
      onSuccess(this.objects[type]);
    }

    scope.$on('$destroy', () => off1() && off2());
  }

  this.subscribeToNodes = (scope, onSuccess, onError) => {
    subscribe('nodes', scope, onSuccess, onError);
  }

  this.subscribeToPolicies = (scope, onSuccess, onError) => {
    subscribe('policies', scope, onSuccess, onError);
  }

  const utilization = () => {
    const policyCounts = this.objects.nodes.reduce((accumulator, n) => {
      const annotations = n.metadata.annotations;
      if (!annotations || !annotations['tpm.coreos.com/logstate']) {
        return accumulator;
      }
      JSON.parse(annotations['tpm.coreos.com/logstate'])
        .forEach(l => {
          const policy = l.Policyref;
          if (!policy || l.invalid) {
            // invalid event (not matched by a policy)
            return;
          }
          if (!accumulator[policy]) {
            accumulator[policy] = {};
          }
          accumulator[policy][n.metadata.uid] = 1
        });
      return accumulator;
    }, {});

    this.objects.policies.forEach((policy) => {
      const key = policy.metadata.selfLink;
      policy.metadata.utilization = Object.keys(policyCounts[key] || {}).length;
    });
  }

  const broadcastNodes = _.debounce(() => {
    if (this.loadErrors.nodes) {
      return;
    }
    utilization();
    $rootScope.$broadcast('firehydrant-nodes', this.objects.nodes);
  }, 5000, {leading: true});

  const loadNodes = () => {
    k8s.nodes.list({})
      .then(nodes => {
        this.objects.nodes.splice(0, this.objects.nodes.length);
        this.objects.nodes.push.apply(this.objects.nodes, nodes);
        this.loadErrors.nodes = false;
        broadcastNodes();
      })
      .catch(e => {
        this.objects.nodes.splice(0, this.objects.nodes.length);
        this.loadErrors.nodes = e;
        $rootScope.$broadcast('firehydrant-nodes-error', e);
      });
  }

  $rootScope.$on(k8s.events.NODE_DELETED, (e, data) => {
    resourceMgrSvc.removeFromList(this.objects.nodes, data.resource);
    broadcastNodes();
  });

  $rootScope.$on(k8s.events.NODE_ADDED, (e, data) => {
    resourceMgrSvc.updateInList(this.objects.nodes, data.resource);
    broadcastNodes();
  });

  $rootScope.$on(k8s.events.NODE_MODIFIED, (e, data) => {
    resourceMgrSvc.updateInList(this.objects.nodes, data.resource);
    broadcastNodes();
  });

  const loadPolicies = () => {
    k8s.policies.get()
      .then(policies => {
        // only compare policy.policy ... angular shoves stuff into these objects
        const changed = _.find(policies.items, (p, i) => {
          if (!this.objects.policies[i]) {
            return true;
          }
          if (!_.isEqual(p.policy, this.objects.policies[i].policy)) {
            return true;
          }
        });

        if (!changed) {
          return;
        }
        this.objects.policies.splice(0, this.objects.policies.length);
        this.objects.policies.push.apply(this.objects.policies, policies.items);
        this.loadErrors.policies = false;
        utilization()
        $rootScope.$broadcast('firehydrant-policies', this.objects.policies);
      })
      .catch(e => {
        this.objects.policies.splice(0, this.objects.policies.length);
        this.loadErrors.policies = e;
        $rootScope.$broadcast('firehydrant-policies-error', e);
      });
  };


  this.start = () => {
    $interval(loadPolicies, 30 * 1000);
    loadPolicies();
    loadNodes();
  };
});
